import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateBriefing } from '@/lib/cache/briefing'

/**
 * User-facing briefing endpoint
 * Reads from cache layer directly — no more proxy hop to /api/agent/briefing
 */
export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { data: integrations } = await supabase
            .from('user_integrations')
            .select('provider')
            .eq('user_id', user.id)

        const connectedServices = integrations?.map(i => i.provider) || []

        const briefing = await generateBriefing(user.id)

        return NextResponse.json({
            ...briefing,
            connectedServices,
        })
    } catch (error: any) {
        console.error('Briefing Error:', error)
        return NextResponse.json({ error: 'Briefing unavailable', details: error.message }, { status: 500 })
    }
}
