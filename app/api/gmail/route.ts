import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getGmailMessages } from '@/lib/cache/gmail'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const includeFull = searchParams.get('full') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)
    const force = searchParams.get('force') === 'true'

    // Get user from session or X-User-ID header (voice agent)
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
        const result = await getGmailMessages(userId, { limit, full: includeFull, force })

        if ('error' in result) {
            return NextResponse.json({ error: result.error, connected: false }, { status: 401 })
        }

        // Add events format for voice agent compatibility
        const events = result.messages.map((msg: any) => ({
            actor: msg.from,
            title: msg.subject,
            date: msg.date,
            unread: msg.unread,
        }))

        return NextResponse.json({
            messages: result.messages,
            events,
            connected: true,
        })
    } catch (err) {
        console.error('Gmail Fetch Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
