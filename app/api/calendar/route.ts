import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getValidGoogleToken } from '@/lib/google-auth'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

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
    const providerToken = await getValidGoogleToken(userId)

    if (!providerToken) {
        return NextResponse.json({
            error: 'Google Calendar not connected or token expired. Please reconnect Google.',
            connected: false
        }, { status: 401 })
    }

    try {
        // Get events for the next 7 days
        const now = new Date()
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${now.toISOString()}&` +
            `timeMax=${nextWeek.toISOString()}&` +
            `singleEvents=true&` +
            `orderBy=startTime&` +
            `maxResults=20`,
            {
                headers: {
                    Authorization: `Bearer ${providerToken}`,
                },
            }
        )

        if (!response.ok) {
            const errorData = await response.json()

            // Check for token expiration
            if (response.status === 401) {
                return NextResponse.json({
                    error: 'Google token expired. Please reconnect.',
                    connected: false
                }, { status: 401 })
            }

            return NextResponse.json({
                error: 'Google API error',
                details: errorData
            }, { status: response.status })
        }

        const data = await response.json()

        // Format for UI
        const events = data.items?.map((item: any) => ({
            id: item.id,
            title: item.summary || 'Untitled Event',
            time: item.start?.dateTime
                ? new Date(item.start.dateTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : 'All Day',
            date: item.start?.dateTime
                ? new Date(item.start.dateTime).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                })
                : new Date(item.start?.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                }),
            description: item.description || 'No description',
            start: item.start?.dateTime || item.start?.date,
            location: item.location || null,
            isToday: isToday(item.start?.dateTime || item.start?.date),
        })) || []

        return NextResponse.json({
            events,
            connected: true
        })
    } catch (err) {
        console.error('Calendar Fetch Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

function isToday(dateString: string): boolean {
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
}

// POST - Create a new calendar event
export async function POST(request: NextRequest) {
    const supabase = await createClient()

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
    const providerToken = await getValidGoogleToken(userId)

    if (!providerToken) {
        return NextResponse.json({
            error: 'Google Calendar not connected or token expired. Please reconnect Google.',
            connected: false
        }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { title, date, time, duration = 60, attendees = [] } = body

        if (!title || !date || !time) {
            return NextResponse.json({
                error: 'Missing required fields: title, date, time'
            }, { status: 400 })
        }

        // Build start/end times
        const startDateTime = new Date(`${date}T${time}:00`)

        if (isNaN(startDateTime.getTime())) {
            return NextResponse.json({
                error: 'Invalid date or time format. Please use YYYY-MM-DD and HH:MM.',
                received: { date, time }
            }, { status: 400 })
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

        // Add attendees if provided
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
            console.error('Calendar create error:', errorData)
            return NextResponse.json({
                error: 'Failed to create event',
                details: errorData
            }, { status: response.status })
        }

        const createdEvent = await response.json()

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
