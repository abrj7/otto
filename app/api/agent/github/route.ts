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

    if (!userId) {
        return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
    }

    // Get GitHub token from user_integrations
    const { data: integration } = await supabaseAdmin
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', userId)
        .eq('provider', 'github')
        .single()

    if (!integration?.access_token) {
        return NextResponse.json({
            error: 'GitHub not connected',
            connected: false
        }, { status: 400 })
    }

    try {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {
            headers: {
                Authorization: `Bearer ${integration.access_token}`,
                Accept: 'application/vnd.github+json',
            },
        })

        if (!response.ok) {
            const error = await response.json()
            return NextResponse.json({ error: error.message }, { status: response.status })
        }

        const repos = await response.json()

        return NextResponse.json({
            connected: true,
            repos: repos.map((r: any) => ({
                id: r.id,
                name: r.name,
                fullName: r.full_name,
                description: r.description,
                private: r.private,
                updatedAt: r.updated_at,
            }))
        })
    } catch (err) {
        console.error('GitHub repos fetch error:', err)
        return NextResponse.json({ error: 'Failed to fetch repos' }, { status: 500 })
    }
}
