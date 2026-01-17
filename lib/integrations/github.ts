/**
 * GitHub Integration Client
 */

import type { Event } from '@/types'

const GITHUB_API = 'https://api.github.com'

interface GitHubCommit {
    sha: string
    commit: {
        message: string
        author: {
            name: string
            date: string
        }
    }
    html_url: string
    author?: {
        login: string
    }
}

interface GitHubPR {
    number: number
    title: string
    html_url: string
    user: { login: string }
    created_at: string
    state: string
}

interface GitHubWorkflowRun {
    id: number
    name: string
    status: string
    conclusion: string | null
    html_url: string
    created_at: string
}

export async function getGitHubActivity(
    workspaceId: string,
    intent?: { type: string; person?: string; branch?: string }
): Promise<Event[]> {
    const token = process.env.GITHUB_TOKEN
    if (!token) return []

    const owner = process.env.GITHUB_DEFAULT_OWNER
    const repo = process.env.GITHUB_DEFAULT_REPO
    if (!owner || !repo) return []

    const events: Event[] = []
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
    }

    try {
        // Fetch commits
        const branch = intent?.type === 'person_branch' ? intent.branch : undefined
        const commitsUrl = branch
            ? `${GITHUB_API}/repos/${owner}/${repo}/commits?sha=${branch}&per_page=20`
            : `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=20`

        const commitsRes = await fetch(commitsUrl, { headers })
        if (commitsRes.ok) {
            const commits: GitHubCommit[] = await commitsRes.json()

            // Filter by person if specified
            const filteredCommits = intent?.type === 'person_branch' && intent.person
                ? commits.filter(c =>
                    c.author?.login?.toLowerCase() === intent.person?.toLowerCase() ||
                    c.commit.author.name.toLowerCase() === intent.person?.toLowerCase()
                )
                : commits

            for (const commit of filteredCommits.slice(0, 10)) {
                events.push({
                    id: commit.sha,
                    workspace_id: workspaceId,
                    integration_type: 'github',
                    event_type: 'commit',
                    actor: commit.author?.login || commit.commit.author.name,
                    title: commit.commit.message.split('\n')[0],
                    body: commit.commit.message,
                    url: commit.html_url,
                    metadata: { sha: commit.sha },
                    occurred_at: commit.commit.author.date,
                    created_at: new Date().toISOString(),
                })
            }
        }

        // Fetch open PRs
        const prsRes = await fetch(
            `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=open&per_page=10`,
            { headers }
        )
        if (prsRes.ok) {
            const prs: GitHubPR[] = await prsRes.json()
            for (const pr of prs) {
                events.push({
                    id: `pr-${pr.number}`,
                    workspace_id: workspaceId,
                    integration_type: 'github',
                    event_type: 'pull_request',
                    actor: pr.user.login,
                    title: pr.title,
                    body: null,
                    url: pr.html_url,
                    metadata: { number: pr.number, state: pr.state },
                    occurred_at: pr.created_at,
                    created_at: new Date().toISOString(),
                })
            }
        }

        // Fetch CI status (workflow runs)
        const runsRes = await fetch(
            `${GITHUB_API}/repos/${owner}/${repo}/actions/runs?per_page=5`,
            { headers }
        )
        if (runsRes.ok) {
            const { workflow_runs }: { workflow_runs: GitHubWorkflowRun[] } = await runsRes.json()
            for (const run of workflow_runs) {
                events.push({
                    id: `run-${run.id}`,
                    workspace_id: workspaceId,
                    integration_type: 'github',
                    event_type: 'ci_status',
                    actor: null,
                    title: `${run.name}: ${run.conclusion || run.status}`,
                    body: null,
                    url: run.html_url,
                    metadata: { status: run.status, conclusion: run.conclusion },
                    occurred_at: run.created_at,
                    created_at: new Date().toISOString(),
                })
            }
        }
    } catch (error) {
        console.error('GitHub API error:', error)
    }

    return events
}

export async function syncGitHubRepo(repoId: string): Promise<number> {
    // TODO: Full sync implementation
    const events = await getGitHubActivity(repoId)
    return events.length
}
