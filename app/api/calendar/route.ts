import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Admin client for DB operations (bypasses RLS)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
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
