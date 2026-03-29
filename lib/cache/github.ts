/**
 * GitHub Cache + Incremental Sync
 *
 * Repos:    GET /user/repos — cache list, use If-Modified-Since on re-fetch
 * Commits:  GET /repos/{owner}/{repo}/commits?since=last_synced — only new commits
 * PRs:      GET /repos/{owner}/{repo}/pulls?sort=updated&direction=desc — only recent
 *
 * GitHub doesn't have sync tokens, so we use `since` param + last_synced_at timestamps
 */

import { getValidGithubToken } from '@/lib/github-auth'
import {
    getSyncState, setSyncState, isCacheStale,
    getCachedItems, upsertCachedItems, invalidateCache,
    getTimeAgo,
} from './helpers'

const GITHUB_API = 'https://api.github.com'

interface GitHubSyncOptions {
    force?: boolean
}

interface RepoDetailOptions {
    owner: string
    repo: string
    force?: boolean
}

/**
 * Get user's repos — from cache or sync
 */
export async function getGitHubRepos(userId: string, opts: GitHubSyncOptions = {}) {
    const { force = false } = opts

    const syncState = await getSyncState(userId, 'github')

    if (syncState && !force && !isCacheStale(syncState.last_synced_at, 'github')) {
        const cached = await getCachedItems(userId, 'github', 'repo', 20)
        return { repos: cached.map(c => c.data), fromCache: true, connected: true }
    }

    const token = await getValidGithubToken(userId)
    if (!token) return { error: 'GitHub not connected', connected: false }

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
    }

    // Fetch repos — use per_page=20, fields are auto-trimmed in formatting
    const res = await fetch(`${GITHUB_API}/user/repos?sort=updated&per_page=20`, { headers })
    if (!res.ok) throw new Error(`GitHub repos failed: ${res.status}`)

    const repos = await res.json()

    const items = repos.map((r: any) => ({
        id: r.full_name,
        item_type: 'repo' as const,
        data: {
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            description: r.description,
            private: r.private,
            updatedAt: r.updated_at,
            language: r.language,
            url: r.html_url,
            stars: r.stargazers_count,
            forks: r.forks_count,
            openIssues: r.open_issues_count,
        },
    }))

    await upsertCachedItems(userId, 'github', items)
    await setSyncState(userId, 'github', new Date().toISOString())

    return { repos: items.map((i: any) => i.data), fromCache: false, connected: true }
}

/**
 * Get repo details (commits, PRs, issues) — incremental via `since`
 */
export async function getGitHubRepoDetails(userId: string, opts: RepoDetailOptions) {
    const { owner, repo, force = false } = opts
    const fullName = `${owner}/${repo}`

    const token = await getValidGithubToken(userId)
    if (!token) return { error: 'GitHub not connected', connected: false }

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
    }

    // Check if we have cached data and determine `since` parameter
    const syncState = await getSyncState(userId, 'github')
    const sinceDate = (syncState && !force)
        ? syncState.sync_token || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Parallel fetch: commits, PRs, issues — with tight per_page limits
    const [commitsRes, pullsRes, issuesRes] = await Promise.all([
        fetch(`${GITHUB_API}/repos/${fullName}/commits?since=${sinceDate}&per_page=10`, { headers }),
        fetch(`${GITHUB_API}/repos/${fullName}/pulls?state=all&sort=updated&direction=desc&per_page=10`, { headers }),
        fetch(`${GITHUB_API}/repos/${fullName}/issues?state=all&sort=updated&direction=desc&per_page=10`, { headers }),
    ])

    const [rawCommits, rawPulls, rawIssues] = await Promise.all([
        commitsRes.ok ? commitsRes.json() : [],
        pullsRes.ok ? pullsRes.json() : [],
        issuesRes.ok ? issuesRes.json() : [],
    ])

    // Format commits — NO individual commit detail fetches (eliminates N+1)
    // Use the list response data directly instead of fetching each commit's patch
    const commits = rawCommits.slice(0, 10).map((c: any) => ({
        id: c.sha,
        type: 'commit',
        title: c.commit.message.split('\n')[0],
        message: c.commit.message,
        author: c.commit.author?.name || c.author?.login || 'Unknown',
        date: c.commit.author?.date,
        timeAgo: getTimeAgo(new Date(c.commit.author?.date)),
        sha: c.sha.substring(0, 7),
        url: c.html_url,
    }))

    // Format PRs
    const pullRequests = rawPulls.map((pr: any) => ({
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

    // Format issues (exclude PRs that show up in issues endpoint)
    const issues = rawIssues
        .filter((i: any) => !i.pull_request)
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

    // Cache all items
    const allItems = [
        ...commits.map((c: any) => ({ id: c.id, item_type: 'commit' as const, data: c })),
        ...pullRequests.map((p: any) => ({ id: String(p.id), item_type: 'pr' as const, data: p })),
        ...issues.map((i: any) => ({ id: String(i.id), item_type: 'issue' as const, data: i })),
    ]

    await upsertCachedItems(userId, 'github', allItems)
    await setSyncState(userId, 'github', new Date().toISOString())

    return {
        repo: { name: fullName },
        commits,
        pullRequests,
        issues,
        fromCache: false,
        connected: true,
    }
}

/**
 * Get GitHub events (for voice agent) — unified view across repos
 */
export async function getGitHubEvents(userId: string, opts: { repo?: string, days?: number, force?: boolean } = {}) {
    const { repo: repoParam, days = 1, force = false } = opts

    const token = await getValidGithubToken(userId)
    if (!token) return { error: 'GitHub not connected', connected: false, events: [] }

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
    }

    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)
    const sinceISO = sinceDate.toISOString()

    // Determine target repos
    let targetRepos: string[] = []

    if (repoParam) {
        if (repoParam.includes('/')) {
            targetRepos = [repoParam]
        } else {
            // Look up in cache first, then API
            const cachedRepos = await getCachedItems(userId, 'github', 'repo')
            const match = cachedRepos.find(r => r.data.name?.toLowerCase() === repoParam.toLowerCase())
            if (match) {
                targetRepos = [match.data.fullName]
            } else {
                // Single API call to find the repo
                const userRes = await fetch(`${GITHUB_API}/user`, { headers })
                if (userRes.ok) {
                    const user = await userRes.json()
                    targetRepos = [`${user.login}/${repoParam}`]
                }
            }
        }
    } else {
        // Use cached repos if available, otherwise fetch top 3
        const cachedRepos = await getCachedItems(userId, 'github', 'repo', 3)
        if (cachedRepos.length > 0) {
            targetRepos = cachedRepos.map(r => r.data.fullName)
        } else {
            const reposRes = await fetch(`${GITHUB_API}/user/repos?sort=updated&per_page=3`, { headers })
            if (reposRes.ok) {
                const repos = await reposRes.json()
                targetRepos = repos.map((r: any) => r.full_name)
            }
        }
    }

    // Fetch events from each repo in parallel (max 3)
    const allEvents: any[] = []
    await Promise.all(
        targetRepos.slice(0, 3).map(async (fullName) => {
            // Parallel: commits + PRs per repo
            const [commitsRes, prsRes] = await Promise.all([
                fetch(`${GITHUB_API}/repos/${fullName}/commits?since=${sinceISO}&per_page=10`, { headers }),
                fetch(`${GITHUB_API}/repos/${fullName}/pulls?state=all&sort=updated&direction=desc&per_page=5`, { headers }),
            ])

            if (commitsRes.ok) {
                const commits = await commitsRes.json()
                for (const c of commits) {
                    allEvents.push({
                        event_type: 'commit',
                        actor: c.commit?.author?.name || c.author?.login || 'Unknown',
                        title: c.commit?.message?.split('\n')[0] || 'No message',
                        date: c.commit?.author?.date,
                        repo: fullName,
                    })
                }
            }

            if (prsRes.ok) {
                const prs = await prsRes.json()
                for (const pr of prs) {
                    if (new Date(pr.created_at) > sinceDate) {
                        allEvents.push({
                            event_type: 'pull_request',
                            actor: pr.user?.login || 'Unknown',
                            title: pr.title,
                            date: pr.created_at,
                            state: pr.state,
                            repo: fullName,
                        })
                    }
                }
            }
        })
    )

    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return { events: allEvents.slice(0, 20), connected: true }
}
