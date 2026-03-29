import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getGitHubRepos, getGitHubRepoDetails, getGitHubEvents } from '@/lib/cache/github'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'repos'
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')
    const force = searchParams.get('force') === 'true'

    const supabase = await createClient()
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
        // Events action (voice agent)
        if (action === 'events') {
            const days = parseInt(searchParams.get('days') || '1')
            const repoParam = searchParams.get('repo')
            const result = await getGitHubEvents(userId, { repo: repoParam || undefined, days, force })

            if ('error' in result && !result.connected) {
                return NextResponse.json({ error: result.error, connected: false }, { status: 401 })
            }

            return NextResponse.json({ events: result.events, connected: true })
        }

        // Repos action
        if (action === 'repos') {
            const result = await getGitHubRepos(userId, { force })

            if ('error' in result) {
                return NextResponse.json({ error: result.error, connected: false }, { status: 401 })
            }

            return NextResponse.json({ connected: true, repos: result.repos })
        }

        // Details action
        if (action === 'details') {
            if (!owner || !repo) {
                return NextResponse.json({ error: 'Missing owner or repo parameter' }, { status: 400 })
            }

            const result = await getGitHubRepoDetails(userId, { owner, repo, force })

            if ('error' in result) {
                return NextResponse.json({ error: result.error, connected: false }, { status: 401 })
            }

            return NextResponse.json({
                repo: result.repo,
                commits: result.commits,
                pullRequests: result.pullRequests,
                issues: result.issues,
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (err) {
        console.error('GitHub Fetch Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
