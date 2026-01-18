/**
 * Google Calendar Integration Client
 */

import type { Event } from '@/types'

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

interface CalendarEvent {
    id: string
    summary: string
    description?: string
    start: { dateTime?: string; date?: string }
    end: { dateTime?: string; date?: string }
    htmlLink: string
    organizer?: { email: string; displayName?: string }
    attendees?: Array<{ email: string; displayName?: string; responseStatus: string }>
}

export async function getCalendarEvents(accessToken: string, workspaceId: string): Promise<Event[]> {
    if (!accessToken) return []

    const events: Event[] = []
    const headers = {
        Authorization: `Bearer ${accessToken}`,
    }

    try {
        const now = new Date().toISOString()
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        const calRes = await fetch(
            `${CALENDAR_API}/calendars/primary/events?timeMin=${now}&timeMax=${tomorrow}&singleEvents=true&orderBy=startTime&maxResults=10`,
            { headers }
        )

        if (!calRes.ok) return []

        const { items } = await calRes.json()
        if (!items) return []

        for (const item of items as CalendarEvent[]) {
            const startTime = item.start.dateTime || item.start.date
            events.push({
                id: item.id,
                workspace_id: workspaceId,
                integration_type: 'calendar',
                event_type: 'meeting',
                actor: item.organizer?.displayName || item.organizer?.email || null,
                title: item.summary || '(No title)',
                body: item.description || null,
                url: item.htmlLink,
                metadata: {
                    attendees: item.attendees?.map(a => a.email),
                    end: item.end.dateTime || item.end.date,
                },
                occurred_at: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
                created_at: new Date().toISOString(),
            })
        }
    } catch (error) {
        console.error('Calendar API error:', error)
    }

    return events
}
