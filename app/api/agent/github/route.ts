import { NextRequest, NextResponse } from 'next/server'
import { getGitHubRepos, getGitHubRepoDetails } from '@/lib/cache/github'

/**
 * Agent GitHub endpoint — thin wrapper around cache layer
 * Used by briefing generation. Python agent now calls APIs directly.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const action = searchParams.get('action') || 'repos'
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')

    if (!userId) {
        return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
    }

    try {
        if (action === 'repos') {
            const result = await getGitHubRepos(userId)
            if ('error' in result) {
                return NextResponse.json({ error: result.error, connected: false }, { status: 401 })
            }
            return NextResponse.json({ connected: true, repos: result.repos })
        }

        if (action === 'details') {
            if (!owner || !repo) {
                return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 })
            }
            const result = await getGitHubRepoDetails(userId, { owner, repo })
            if ('error' in result) {
                return NextResponse.json({ error: result.error, connected: false }, { status: 401 })
            }
            return NextResponse.json({
                commits: result.commits,
                pullRequests: result.pullRequests,
                repo: result.repo,
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (err) {
        console.error('Agent GitHub Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
