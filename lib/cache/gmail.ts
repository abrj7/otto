/**
 * Gmail Cache + Incremental Sync
 *
 * First sync:  GET /messages (list) + GET /messages/{id} (details) → cache all + store historyId
 * Next sync:   GET /history?startHistoryId=X → only fetch new/deleted messages → diff update cache
 * Token expired (410): Full re-sync
 */

import { getValidGoogleToken } from '@/lib/google-auth'
import {
    getSyncState, setSyncState, isCacheStale,
    getCachedItems, upsertCachedItems, removeCachedItems, invalidateCache,
    getTimeAgo,
} from './helpers'

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

interface GmailSyncOptions {
    limit?: number
    full?: boolean      // include email body
    force?: boolean     // ignore cache TTL
}

/**
 * Get emails — from cache if fresh, otherwise incremental sync
 */
export async function getGmailMessages(userId: string, opts: GmailSyncOptions = {}) {
    const { limit = 10, full = false, force = false } = opts

    // 1. Check cache freshness
    const syncState = await getSyncState(userId, 'gmail')

    if (syncState && !force && !isCacheStale(syncState.last_synced_at, 'gmail')) {
        // Cache is fresh — read from DB
        const cached = await getCachedItems(userId, 'gmail', 'email', limit)
        return {
            messages: cached.map(item => item.data),
            fromCache: true,
            connected: true,
        }
    }

    // 2. Get valid token
    const accessToken = await getValidGoogleToken(userId)
    if (!accessToken) {
        return { error: 'Gmail not connected', connected: false }
    }

    const headers = { Authorization: `Bearer ${accessToken}` }

    // 3. Attempt incremental sync if we have a historyId
    if (syncState?.sync_token) {
        const incremental = await incrementalSync(userId, syncState.sync_token, headers, full)
        if (incremental !== null) {
            // Incremental sync succeeded
            const cached = await getCachedItems(userId, 'gmail', 'email', limit)
            return {
                messages: cached.map(item => item.data),
                fromCache: false,
                connected: true,
            }
        }
        // If incremental returned null, historyId expired — fall through to full sync
    }

    // 4. Full sync
    await fullSync(userId, headers, full)
    const cached = await getCachedItems(userId, 'gmail', 'email', limit)
    return {
        messages: cached.map(item => item.data),
        fromCache: false,
        connected: true,
    }
}

/**
 * Full sync: fetch message list + details, store everything
 */
async function fullSync(userId: string, headers: Record<string, string>, full: boolean) {
    // Use fields parameter to only request what we need from the list endpoint
    const listRes = await fetch(
        `${GMAIL_API}/messages?maxResults=20&labelIds=INBOX&fields=messages(id),historyId`,
        { headers }
    )

    if (!listRes.ok) throw new Error(`Gmail list failed: ${listRes.status}`)

    const listData = await listRes.json()
    const messageIds: string[] = (listData.messages || []).map((m: any) => m.id)
    const historyId = listData.historyId

    if (messageIds.length === 0) {
        await setSyncState(userId, 'gmail', historyId || null)
        return
    }

    // Fetch details — use metadata format with fields to minimize payload
    const format = full ? 'full' : 'metadata'
    const metadataHeaders = full ? '' : '&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date'
    const fields = full
        ? 'id,snippet,labelIds,payload,historyId'
        : 'id,snippet,labelIds,payload.headers,historyId'

    const details = await Promise.all(
        messageIds.slice(0, 20).map(async (id) => {
            const res = await fetch(
                `${GMAIL_API}/messages/${id}?format=${format}${metadataHeaders}&fields=${fields}`,
                { headers }
            )
            return res.ok ? res.json() : null
        })
    )

    // Format and cache
    const items = details.filter(Boolean).map((msg: any) => ({
        id: msg.id as string,
        item_type: 'email' as const,
        data: formatMessage(msg, full),
    }))

    // Clear old cache and write new
    await invalidateCache(userId, 'gmail')
    await upsertCachedItems(userId, 'gmail', items)

    // Find max historyId from messages for more accurate cursor
    const maxHistory = details.filter(Boolean).reduce(
        (max: string, msg: any) => (msg.historyId && msg.historyId > max ? msg.historyId : max),
        historyId || '0'
    )
    await setSyncState(userId, 'gmail', maxHistory)
}

/**
 * Incremental sync: use Gmail History API to get only changes
 * Returns null if historyId is expired (caller should do full sync)
 */
async function incrementalSync(
    userId: string,
    historyId: string,
    headers: Record<string, string>,
    full: boolean
): Promise<boolean | null> {
    const historyRes = await fetch(
        `${GMAIL_API}/history?startHistoryId=${historyId}&historyTypes=messageAdded&historyTypes=messageDeleted&labelId=INBOX`,
        { headers }
    )

    // 410 Gone = historyId too old, need full sync
    if (historyRes.status === 410 || historyRes.status === 404) {
        return null
    }

    if (!historyRes.ok) {
        console.error(`Gmail history failed: ${historyRes.status}`)
        return null
    }

    const historyData = await historyRes.json()
    const newHistoryId = historyData.historyId

    // Collect added and deleted message IDs
    const addedIds = new Set<string>()
    const deletedIds = new Set<string>()

    for (const record of historyData.history || []) {
        for (const added of record.messagesAdded || []) {
            addedIds.add(added.message.id)
        }
        for (const deleted of record.messagesDeleted || []) {
            deletedIds.add(deleted.message.id)
        }
    }

    // Remove deleted from added (if added then deleted in same window)
    for (const id of deletedIds) {
        addedIds.delete(id)
    }

    // Fetch details for new messages only
    if (addedIds.size > 0) {
        const format = full ? 'full' : 'metadata'
        const metadataHeaders = full ? '' : '&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date'

        const details = await Promise.all(
            Array.from(addedIds).map(async (id) => {
                const res = await fetch(
                    `${GMAIL_API}/messages/${id}?format=${format}${metadataHeaders}`,
                    { headers }
                )
                return res.ok ? res.json() : null
            })
        )

        const items = details.filter(Boolean).map((msg: any) => ({
            id: msg.id as string,
            item_type: 'email' as const,
            data: formatMessage(msg, full),
        }))

        await upsertCachedItems(userId, 'gmail', items)
    }

    // Remove deleted messages from cache
    if (deletedIds.size > 0) {
        await removeCachedItems(userId, 'gmail', Array.from(deletedIds))
    }

    await setSyncState(userId, 'gmail', newHistoryId || historyId)
    return true
}

/**
 * Format a Gmail message into our standard shape
 */
function formatMessage(msg: any, full: boolean) {
    const msgHeaders = msg.payload?.headers || []
    const from = msgHeaders.find((h: any) => h.name === 'From')?.value || 'Unknown'
    const subject = msgHeaders.find((h: any) => h.name === 'Subject')?.value || '(no subject)'
    const date = msgHeaders.find((h: any) => h.name === 'Date')?.value || ''

    const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/)
    const senderName = fromMatch ? fromMatch[1].replace(/"/g, '') : from
    const senderEmail = fromMatch ? fromMatch[2] : from

    let body = ''
    if (full && msg.payload) {
        body = extractEmailBody(msg.payload)
        if (body.length > 4000) body = body.substring(0, 4000) + '...'
    }

    return {
        id: msg.id,
        from: senderName,
        email: senderEmail,
        subject,
        snippet: msg.snippet || '',
        body: full ? body : undefined,
        date,
        timeAgo: getTimeAgo(new Date(date)),
        unread: msg.labelIds?.includes('UNREAD') || false,
    }
}

function extractEmailBody(payload: any): string {
    if (!payload) return ''
    if (payload.body?.data) return decodeBase64(payload.body.data)

    if (payload.parts) {
        const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain')
        if (textPart?.body?.data) return decodeBase64(textPart.body.data)

        const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html')
        if (htmlPart?.body?.data) {
            return decodeBase64(htmlPart.body.data).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        }

        for (const part of payload.parts) {
            if (part.parts) {
                const nested = extractEmailBody(part)
                if (nested) return nested
            }
        }
    }
    return ''
}

function decodeBase64(data: string): string {
    try {
        return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    } catch {
        return ''
    }
}
