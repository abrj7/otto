import { NextRequest, NextResponse } from 'next/server'
import { getGmailMessages } from '@/lib/cache/gmail'

/**
 * Agent Gmail endpoint — thin wrapper around cache layer
 * Used by briefing generation. Python agent now calls APIs directly.
 */
export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('user_id')
    const includeFull = request.nextUrl.searchParams.get('full') === 'true'
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '10'), 20)

    if (!userId) {
        return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
    }

    try {
        const result = await getGmailMessages(userId, { limit, full: includeFull })

        if ('error' in result) {
            return NextResponse.json({ error: result.error, connected: false }, { status: 401 })
        }

        return NextResponse.json({ messages: result.messages, connected: true })
    } catch (err) {
        console.error('Agent Gmail Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
