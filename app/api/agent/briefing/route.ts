import { NextRequest, NextResponse } from 'next/server'
import { generateBriefing } from '@/lib/cache/briefing'

/**
 * Agent briefing endpoint — delegates to shared briefing generator
 * Kept for backwards compatibility. Both /api/briefing and /api/agent/briefing
 * now use the same cache-backed generation function.
 */

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('user_id')
    const forceRefresh = req.nextUrl.searchParams.get('force') === 'true'

    if (!userId) {
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    try {
        const briefing = await generateBriefing(userId, forceRefresh)
        return NextResponse.json(briefing)
    } catch (error: any) {
        console.error('Agent briefing error:', error)
        return NextResponse.json({ error: 'Briefing generation failed' }, { status: 500 })
    }
}
