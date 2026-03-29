/**
 * Calendar Cache + Incremental Sync
 *
 * First sync:  GET /events?timeMin&timeMax → cache all + store nextSyncToken
 * Next sync:   GET /events?syncToken=X → only changed/deleted events → diff update
 * Token expired (410): Full re-sync
 */

import { getValidGoogleToken } from '@/lib/google-auth'
import {
    getSyncState, setSyncState, isCacheStale,
    getCachedItems, upsertCachedItems, removeCachedItems, invalidateCache,
    getTimeAgo,
} from './helpers'

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

interface CalendarSyncOptions {
    timeframe?: 'today' | 'week' | 'next-event'
    force?: boolean
}

/**
 * Get calendar events — from cache if fresh, otherwise incremental sync
 */
export async function getCalendarEvents(userId: string, opts: CalendarSyncOptions = {}) {
    const { timeframe = 'week', force = false } = opts

    // 1. Check cache freshness
    const syncState = await getSyncState(userId, 'calendar')

    if (syncState && !force && !isCacheStale(syncState.last_synced_at, 'calendar')) {
        const cached = await getCachedItems(userId, 'calendar', 'event')
        const filtered = filterByTimeframe(cached.map(c => c.data), timeframe)
        return { events: filtered, fromCache: true, connected: true }
    }

    // 2. Get valid token
    const accessToken = await getValidGoogleToken(userId)
    if (!accessToken) {
        return { error: 'Google Calendar not connected', connected: false }
    }

    const headers = { Authorization: `Bearer ${accessToken}` }

    // 3. Attempt incremental sync if we have a syncToken
    if (syncState?.sync_token) {
        const result = await incrementalSync(userId, syncState.sync_token, headers)
        if (result !== null) {
            const cached = await getCachedItems(userId, 'calendar', 'event')
            const filtered = filterByTimeframe(cached.map(c => c.data), timeframe)
            return { events: filtered, fromCache: false, connected: true }
        }
        // syncToken expired — fall through to full sync
    }

    // 4. Full sync
    await fullSync(userId, headers)
    const cached = await getCachedItems(userId, 'calendar', 'event')
    const filtered = filterByTimeframe(cached.map(c => c.data), timeframe)
    return { events: filtered, fromCache: false, connected: true }
}

/**
 * Full sync: fetch events for the next 30 days, cache all
 */
async function fullSync(userId: string, headers: Record<string, string>) {
    const now = new Date()
    const timeMin = now.toISOString()
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const timeMax = thirtyDaysOut.toISOString()

    // Use fields to request only what we need
    const fields = 'items(id,summary,start,end,location,description,status),nextSyncToken'

    const res = await fetch(
        `${CALENDAR_API}?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50&fields=${fields}`,
        { headers }
    )

    if (!res.ok) throw new Error(`Calendar list failed: ${res.status}`)

    const data = await res.json()
    const nextSyncToken = data.nextSyncToken

    const items = (data.items || [])
        .filter((e: any) => e.status !== 'cancelled')
        .map((event: any) => ({
            id: event.id as string,
            item_type: 'event' as const,
            data: formatEvent(event),
        }))

    await invalidateCache(userId, 'calendar')
    await upsertCachedItems(userId, 'calendar', items)
    await setSyncState(userId, 'calendar', nextSyncToken || null)
}

/**
 * Incremental sync using Calendar syncToken
 * Returns null if token expired (caller should do full sync)
 */
async function incrementalSync(
    userId: string,
    syncToken: string,
    headers: Record<string, string>
): Promise<boolean | null> {
    const res = await fetch(
        `${CALENDAR_API}?syncToken=${syncToken}`,
        { headers }
    )

    // 410 Gone = syncToken expired
    if (res.status === 410) return null
    if (!res.ok) {
        console.error(`Calendar sync failed: ${res.status}`)
        return null
    }

    const data = await res.json()
    const newSyncToken = data.nextSyncToken

    const toUpsert: { id: string; item_type: 'event'; data: any }[] = []
    const toDelete: string[] = []

    for (const event of data.items || []) {
        if (event.status === 'cancelled') {
            toDelete.push(event.id)
        } else {
            toUpsert.push({
                id: event.id,
                item_type: 'event',
                data: formatEvent(event),
            })
        }
    }

    if (toUpsert.length > 0) await upsertCachedItems(userId, 'calendar', toUpsert)
    if (toDelete.length > 0) await removeCachedItems(userId, 'calendar', toDelete)
    await setSyncState(userId, 'calendar', newSyncToken || syncToken)

    return true
}

function formatEvent(event: any) {
    const startDt = event.start?.dateTime || event.start?.date
    return {
        id: event.id,
        title: event.summary || 'Untitled Event',
        time: event.start?.dateTime
            ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'All Day',
        date: startDt
            ? new Date(startDt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : '',
        description: event.description || '',
        start: startDt,
        end: event.end?.dateTime || event.end?.date,
        location: event.location || null,
        isToday: startDt ? new Date(startDt).toDateString() === new Date().toDateString() : false,
    }
}

function filterByTimeframe(events: any[], timeframe: string): any[] {
    const now = new Date()

    if (timeframe === 'today') {
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)
        return events.filter(e => {
            const start = new Date(e.start)
            return start >= now && start <= endOfDay
        })
    }

    if (timeframe === 'next-event') {
        const upcoming = events.filter(e => new Date(e.start) >= now)
        return upcoming.slice(0, 1)
    }

    // Default: week
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return events.filter(e => {
        const start = new Date(e.start)
        return start >= now && start <= nextWeek
    }).slice(0, 10)
}
