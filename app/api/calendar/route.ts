import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const providerToken = session.provider_token

    if (!providerToken) {
        return NextResponse.json({ error: 'No Google token found. Please sign in with Google.' }, { status: 400 })
    }

    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString(), {
            headers: {
                Authorization: `Bearer ${providerToken}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({ error: 'Google API error', details: errorData }, { status: response.status })
        }

        const data = await response.json()

        // Format for UI
        const events = data.items?.map((item: any) => ({
            id: item.id,
            title: item.summary,
            time: item.start?.dateTime
                ? new Date(item.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'All Day',
            description: item.description || 'No description',
            start: item.start?.dateTime || item.start?.date,
        })) || []

        return NextResponse.json({ events })
    } catch (err) {
        console.error('Calendar Fetch Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
