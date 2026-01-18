import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delegate to the AI Agent Briefing endpoint with Bear-1 Compression
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    try {
        // Fetch integrations locally to maintain backward compatibility
        const { data: integrations } = await supabase
            .from('user_integrations')
            .select('provider')
            .eq('user_id', user.id)

        const connectedServices = integrations?.map(i => i.provider) || []

        const agentRes = await fetch(`${baseUrl}/api/agent/briefing?user_id=${user.id}`, {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        })

        if (!agentRes.ok) {
            console.error("Agent Briefing Failed:", await agentRes.text())
            throw new Error("Failed to generate AI briefing")
        }

        const briefingData = await agentRes.json()

        // Merge connectedServices into the response for UI compatibility
        return NextResponse.json({
            ...briefingData,
            connectedServices
        })

    } catch (error: any) {
        console.error("Briefing Proxy Error:", error)
        return NextResponse.json({
            error: "Briefing unavailable",
            details: error.message
        }, { status: 500 })
    }
}
