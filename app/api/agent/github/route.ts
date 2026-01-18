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
    const action = searchParams.get('action') || 'repos'
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')

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

    const headers = {
        Authorization: `Bearer ${integration.access_token}`,
        Accept: 'application/vnd.github+json',
    }

    try {
        if (action === 'repos') {
            const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', { headers })

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
        }

        if (action === 'details') {
            if (!owner || !repo) {
                return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 })
            }

            const [commitsRes, pullsRes, issuesRes] = await Promise.all([
                fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, { headers }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=10`, { headers }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=10`, { headers })
            ])

            const [commits, pulls, issues] = await Promise.all([
                commitsRes.ok ? commitsRes.json() : [],
                pullsRes.ok ? pullsRes.json() : [],
                issuesRes.ok ? issuesRes.json() : []
            ])

            // Fetch detailed commit info (patches) for top 5
            const recentCommits = commits.slice(0, 5)
            const detailedCommits = await Promise.all(
                recentCommits.map(async (commit: any) => {
                    try {
                        const detailRes = await fetch(commit.url, { headers })
                        const detail = detailRes.ok ? await detailRes.json() : null

                        return {
                            id: commit.sha,
                            type: 'commit',
                            title: commit.commit.message.split('\n')[0],
                            message: commit.commit.message,
                            author: commit.commit.author?.name || commit.author?.login || 'Unknown',
                            date: commit.commit.author?.date,
                            timeAgo: getTimeAgo(new Date(commit.commit.author?.date)),
                            files: detail?.files?.map((f: any) => ({
                                filename: f.filename,
                                status: f.status,
                                patch: f.patch
                            })) || []
                        }
                    } catch {
                        return {
                            id: commit.sha,
                            title: commit.commit.message,
                            author: 'Unknown'
                        }
                    }
                })
            )

            const formattedPRs = pulls.map((pr: any) => ({
                id: pr.id,
                title: pr.title,
                author: pr.user?.login || 'Unknown',
                state: pr.state,
                timeAgo: getTimeAgo(new Date(pr.created_at))
            }))

            return NextResponse.json({
                commits: detailedCommits,
                pullRequests: formattedPRs,
                repo: { name: `${owner}/${repo}` }
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (err) {
        console.error('GitHub fetch error:', err)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
}
