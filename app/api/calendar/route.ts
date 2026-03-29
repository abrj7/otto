import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCalendarEvents } from '@/lib/cache/calendar'
import { getValidGoogleToken } from '@/lib/google-auth'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const timeframe = (searchParams.get('timeframe') || 'week') as 'today' | 'week' | 'next-event'
    const force = searchParams.get('force') === 'true'

    let userId: string | null = null
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        userId = user.id
    } else {
        userId = request.headers.get('X-User-ID')
    }

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await getCalendarEvents(userId, { timeframe, force })

        if ('error' in result) {
            return NextResponse.json({ error: result.error, connected: false }, { status: 401 })
        }

        return NextResponse.json({ events: result.events, connected: true })
    } catch (err) {
        console.error('Calendar Fetch Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST - Create a new calendar event (unchanged — writes go direct to API)
export async function POST(request: NextRequest) {
    const supabase = await createClient()

    let userId: string | null = null
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        userId = user.id
    } else {
        userId = request.headers.get('X-User-ID')
    }

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const providerToken = await getValidGoogleToken(userId)
    if (!providerToken) {
        return NextResponse.json({ error: 'Google Calendar not connected', connected: false }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { title, date, time, duration = 60, attendees = [] } = body

        if (!title || !date || !time) {
            return NextResponse.json({ error: 'Missing required fields: title, date, time' }, { status: 400 })
        }

        const startDateTime = new Date(`${date}T${time}:00`)
        if (isNaN(startDateTime.getTime())) {
            return NextResponse.json({ error: 'Invalid date or time format' }, { status: 400 })
        }

        const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000)

        const eventPayload: any = {
            summary: title,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        }

        if (attendees.length > 0) {
            eventPayload.attendees = attendees.map((email: string) => ({ email }))
        }

        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${providerToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventPayload),
            }
        )

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ error: 'Failed to create event', details: errorData }, { status: response.status })
        }

        const createdEvent = await response.json()

        // Invalidate calendar cache so next read picks up the new event
        const { invalidateCache } = await import('@/lib/cache/helpers')
        await invalidateCache(userId, 'calendar')

        return NextResponse.json({
            success: true,
            event: {
                id: createdEvent.id,
                title: createdEvent.summary,
                start: createdEvent.start?.dateTime,
                htmlLink: createdEvent.htmlLink,
            }
        }, { status: 201 })
    } catch (err) {
        console.error('Calendar Create Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
