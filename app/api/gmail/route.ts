import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getValidGoogleToken } from '@/lib/google-auth'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    // Get query params
    const { searchParams } = new URL(request.url)
    const includeFull = searchParams.get('full') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    // Get user - either from session cookie OR from X-User-ID header (for agent)
    let userId: string | null = null

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        userId = user.id
    } else {
        // Fallback to X-User-ID header (used by voice agent)
        userId = request.headers.get('X-User-ID')
    }

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get valid Google token (auto-refreshes if expired)
    const accessToken = await getValidGoogleToken(userId)

    if (!accessToken) {
        return NextResponse.json({
            error: 'Gmail not connected or token expired. Please reconnect Google.',
            connected: false
        }, { status: 401 })
    }

    try {
        // Fetch messages from Gmail API
        const response = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        )

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({
                error: 'Gmail API error',
                details: errorData
            }, { status: response.status })
        }

        const data = await response.json()
        const messageIds = data.messages || []

        // Fetch details for each message (in parallel)
        const format = includeFull ? 'full' : 'metadata'
        const metadataHeaders = includeFull ? '' : '&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date'

        const messageDetails = await Promise.all(
            messageIds.slice(0, limit).map(async (msg: any) => {
                const detailResponse = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=${format}${metadataHeaders}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                )
                return detailResponse.json()
            })
        )

        // Format messages for UI
        const formattedMessages = messageDetails.map((msg: any) => {
            const headers = msg.payload?.headers || []
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown'
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(no subject)'
            const date = headers.find((h: any) => h.name === 'Date')?.value || ''

            // Extract email and name from "Name <email@example.com>" format
            const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/)
            const senderName = fromMatch ? fromMatch[1].replace(/"/g, '') : from
            const senderEmail = fromMatch ? fromMatch[2] : from

            let body = ''
            if (includeFull) {
                // Extract email body from payload
                body = extractEmailBody(msg.payload)
                // Truncate to 4000 chars for AI
                if (body.length > 4000) {
                    body = body.substring(0, 4000) + '...'
                }
            }

            return {
                id: msg.id,
                from: senderName,
                email: senderEmail,
                subject,
                snippet: msg.snippet || '',
                body: includeFull ? body : undefined,
                date,
                timeAgo: getTimeAgo(new Date(date)),
                unread: msg.labelIds?.includes('UNREAD') || false,
            }
        })

        // Also create events format for voice agent
        const events = formattedMessages.map((msg: any) => ({
            actor: msg.from,
            title: msg.subject,
            date: msg.date,
            unread: msg.unread,
        }))

        return NextResponse.json({
            messages: formattedMessages,
            events,  // For voice agent compatibility
            connected: true
        })
    } catch (err) {
        console.error('Gmail Fetch Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Helper function to extract email body from Gmail payload
function extractEmailBody(payload: any): string {
    if (!payload) return ''

    // If body data exists directly
    if (payload.body?.data) {
        return decodeBase64(payload.body.data)
    }

    // If multipart, find text/plain or text/html part
    if (payload.parts) {
        // Prefer text/plain
        const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain')
        if (textPart?.body?.data) {
            return decodeBase64(textPart.body.data)
        }

        // Fallback to text/html (strip tags)
        const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html')
        if (htmlPart?.body?.data) {
            const html = decodeBase64(htmlPart.body.data)
            // Basic HTML tag stripping
            return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        }

        // Recursively check nested parts
        for (const part of payload.parts) {
            if (part.parts) {
                const nested = extractEmailBody(part)
                if (nested) return nested
            }
        }
    }

    return ''
}

// Decode base64url encoded string
function decodeBase64(data: string): string {
    try {
        // Gmail uses base64url encoding (- and _ instead of + and /)
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
        return Buffer.from(base64, 'base64').toString('utf-8')
    } catch (err) {
        console.error('Base64 decode error:', err)
        return ''
    }
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return `${Math.floor(seconds / 604800)}w ago`
}
