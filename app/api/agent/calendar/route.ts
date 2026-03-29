import { NextRequest, NextResponse } from 'next/server'
import { getCalendarEvents } from '@/lib/cache/calendar'

/**
 * Agent Calendar endpoint — thin wrapper around cache layer
 * Used by briefing generation. Python agent now calls APIs directly.
 */
export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('user_id')
    const timeframe = (request.nextUrl.searchParams.get('timeframe') || 'week') as 'today' | 'week' | 'next-event'

    if (!userId) {
        return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
    }

    try {
        const result = await getCalendarEvents(userId, { timeframe })

        if ('error' in result) {
            return NextResponse.json({ error: result.error, connected: false }, { status: 401 })
        }

        return NextResponse.json({ events: result.events, connected: true })
    } catch (err) {
        console.error('Agent Calendar Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
