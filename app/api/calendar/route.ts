import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Admin client for DB operations (bypasses RLS)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'week' // today, week, next-event

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get Google token from user_integrations first (using admin to bypass RLS)
    const { data: integration } = await supabaseAdmin
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single()


    // Fallback to session provider_token if user_integrations doesn't have it
    let providerToken = integration?.access_token

    if (!providerToken) {
        const { data: { session } } = await supabase.auth.getSession()
        providerToken = session?.provider_token
    }

    if (!providerToken) {
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
