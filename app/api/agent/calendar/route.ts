import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Admin client for DB operations (bypasses RLS)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const timeframe = searchParams.get('timeframe') || 'week'

    if (!userId) {
        return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
    }

    // Get Google token from user_integrations
    const { data: integration } = await supabaseAdmin
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single()

    if (!integration?.access_token) {
        return NextResponse.json({
            error: 'Google Calendar not connected',
            connected: false
        }, { status: 400 })
    }

    try {
        // Calculate time range based on timeframe
        const now = new Date()
        let timeMin = now.toISOString()
        let timeMax: string
        let maxResults = 10

        if (timeframe === 'today') {
            const endOfDay = new Date(now)
            endOfDay.setHours(23, 59, 59, 999)
            timeMax = endOfDay.toISOString()
        } else if (timeframe === 'next-event') {
            maxResults = 1
            const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            timeMax = nextMonth.toISOString()
        } else { // week
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            timeMax = nextWeek.toISOString()
        }

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${timeMin}&` +
            `timeMax=${timeMax}&` +
            `singleEvents=true&` +
            `orderBy=startTime&` +
            `maxResults=${maxResults}`,
            {
                headers: {
                    Authorization: `Bearer ${integration.access_token}`,
                },
            }
        )

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({
                error: 'Calendar API error',
                details: errorData
            }, { status: response.status })
        }

        const data = await response.json()
        const events = (data.items || []).map((event: any) => ({
            id: event.id,
            title: event.summary || '(No title)',
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            location: event.location,
            description: event.description,
        }))

        return NextResponse.json({
            events,
            connected: true
        })
    } catch (err) {
        console.error('Calendar Fetch Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
