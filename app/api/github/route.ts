import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Admin client for DB operations (bypasses RLS)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'repos'
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')

    // Get user's GitHub token
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let githubToken: string | null = null

    if (user) {
        const { data: integration } = await supabaseAdmin
            .from('user_integrations')
            .select('access_token')
            .eq('user_id', user.id)
            .eq('provider', 'github')
            .single()

        githubToken = integration?.access_token || null
    }

    const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
    }

    if (githubToken) {
        headers.Authorization = `Bearer ${githubToken}`
    }

    // Action: Get user's repos
    if (action === 'repos') {
        if (!githubToken) {
            return NextResponse.json({
                error: 'GitHub not connected',
                connected: false
            }, { status: 401 })
        }

        try {
            const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {
                headers,
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

    // Action: Get repo details
    if (action === 'details') {
        if (!owner || !repo) {
            return NextResponse.json({
                error: 'Missing owner or repo parameter',
            }, { status: 400 })
        }

        try {
            const [commitsRes, pullsRes, issuesRes, repoRes] = await Promise.all([
                fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, { headers }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=10`, { headers }),
                fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=10`, { headers }),
                fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
            ])

            if (!repoRes.ok) {
                const error = await repoRes.json()
                return NextResponse.json({
                    error: 'Repository not found',
                    details: error.message
                }, { status: 404 })
            }

            const [commits, pulls, issues, repoInfo] = await Promise.all([
                commitsRes.ok ? commitsRes.json() : [],
                pullsRes.ok ? pullsRes.json() : [],
                issuesRes.ok ? issuesRes.json() : [],
                repoRes.json(),
            ])

            // Format commits
            const formattedCommits = commits.map((commit: any) => ({
                id: commit.sha,
                type: 'commit',
                title: commit.commit.message.split('\n')[0],
                author: commit.commit.author?.name || commit.author?.login || 'Unknown',
                date: commit.commit.author?.date,
                timeAgo: getTimeAgo(new Date(commit.commit.author?.date)),
                sha: commit.sha.substring(0, 7),
                url: commit.html_url,
            }))

            // Format PRs
            const formattedPRs = pulls.map((pr: any) => ({
                id: pr.id,
                type: 'pr',
                title: pr.title,
                author: pr.user?.login || 'Unknown',
                state: pr.state,
                merged: pr.merged_at !== null,
                date: pr.created_at,
                timeAgo: getTimeAgo(new Date(pr.created_at)),
                number: pr.number,
                url: pr.html_url,
            }))

            // Format issues
            const formattedIssues = issues
                .filter((issue: any) => !issue.pull_request)
                .map((issue: any) => ({
                    id: issue.id,
                    type: 'issue',
                    title: issue.title,
                    author: issue.user?.login || 'Unknown',
                    state: issue.state,
                    date: issue.created_at,
                    timeAgo: getTimeAgo(new Date(issue.created_at)),
                    number: issue.number,
                    url: issue.html_url,
                    labels: issue.labels?.map((l: any) => l.name) || [],
                }))

            return NextResponse.json({
                repo: {
                    name: repoInfo.full_name,
                    description: repoInfo.description,
                    stars: repoInfo.stargazers_count,
                    forks: repoInfo.forks_count,
                    openIssues: repoInfo.open_issues_count,
                    language: repoInfo.language,
                    url: repoInfo.html_url,
                },
                commits: formattedCommits,
                pullRequests: formattedPRs,
                issues: formattedIssues,
            })
        } catch (err) {
            console.error('GitHub Fetch Error:', err)
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
        }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return `${Math.floor(seconds / 604800)}w ago`
}
