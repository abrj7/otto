/**
 * Context Builder - Aggregates data from all connected services
 * for the voice agent
 */

import type {
  AgentContext,
  AgentGitHubContext,
  AgentCalendarContext,
  AgentEmailContext,
  ContextBuildResult,
  GitHubCommit,
  CalendarEvent,
} from '@/types/agent'

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Build complete context for a user
 */
export async function buildUserContext(
  userId: string,
  userEmail?: string
): Promise<ContextBuildResult> {
  try {
    const context: AgentContext = {
      user: {
        id: userId,
        email: userEmail,
      },
      timestamp: new Date().toISOString(),
      summary: '',
      services_connected: [],
    }

    // Fetch data from all services in parallel
    const [githubData, calendarData, emailData] = await Promise.allSettled([
      fetchGitHubContext(userId),
      fetchCalendarContext(userId),
      fetchEmailContext(userId),
    ])

    // Process GitHub data
    if (githubData.status === 'fulfilled' && githubData.value) {
      context.github = githubData.value
      context.services_connected.push('github')
    }

    // Process Calendar data
    if (calendarData.status === 'fulfilled' && calendarData.value) {
      context.calendar = calendarData.value
      context.services_connected.push('calendar')
    }

    // Process Email data
    if (emailData.status === 'fulfilled' && emailData.value) {
      context.email = emailData.value
      context.services_connected.push('email')
    }

    // Generate natural language summary
    context.summary = generateSummary(context)

    return {
      success: true,
      context,
    }
  } catch (error) {
    console.error('Context building error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch GitHub activity for the last 7 days
 */
async function fetchGitHubContext(userId: string): Promise<AgentGitHubContext | null> {
  try {
    // Get user's repos
    const reposRes = await fetch(`${API_BASE_URL}/api/github?action=repos`, {
      headers: { 'X-User-ID': userId },
    })

    if (!reposRes.ok) return null

    const reposData = await reposRes.json()
    if (!reposData.connected || !reposData.repos?.length) return null

    // Fetch details for top 3 most recently updated repos
    const topRepos = reposData.repos.slice(0, 3)
    const repoDetails = await Promise.allSettled(
      topRepos.map((repo: any) =>
        fetch(
          `${API_BASE_URL}/api/github?action=details&owner=${repo.fullName.split('/')[0]}&repo=${repo.fullName.split('/')[1]}`,
          { headers: { 'X-User-ID': userId } }
        ).then(r => r.json())
      )
    )

    // Aggregate commits, PRs, and issues from all repos
    const allCommits: GitHubCommit[] = []
    const allPRs: any[] = []
    const allIssues: any[] = []
    const activeRepoNames: string[] = []

    repoDetails.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const data = result.value
        const repoName = topRepos[idx].fullName

        if (data.commits) {
          allCommits.push(...data.commits.map((c: any) => ({ ...c, repo: repoName })))
        }
        if (data.pullRequests) {
          allPRs.push(...data.pullRequests.map((pr: any) => ({ ...pr, repo: repoName })))
        }
        if (data.issues) {
          allIssues.push(...data.issues.map((i: any) => ({ ...i, repo: repoName })))
        }

        activeRepoNames.push(repoName)
      }
    })

    // Filter to last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentCommits = allCommits.filter(c => new Date(c.date) > sevenDaysAgo).slice(0, 20)

    return {
      recent_commits: recentCommits,
      pull_requests: allPRs.slice(0, 10),
      issues: allIssues.slice(0, 10),
      repositories: activeRepoNames,
    }
  } catch (error) {
    console.error('GitHub context fetch error:', error)
    return null
  }
}

/**
 * Fetch calendar events (past 24h + next 7 days)
 */
async function fetchCalendarContext(userId: string): Promise<AgentCalendarContext | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/calendar`, {
      headers: { 'X-User-ID': userId },
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data.connected || !data.events) return null

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Separate past and future events
    const pastEvents: CalendarEvent[] = []
    const upcomingEvents: CalendarEvent[] = []

    data.events.forEach((event: CalendarEvent) => {
      const eventDate = new Date(event.start)
      if (eventDate < now && eventDate > yesterday) {
        pastEvents.push(event)
      } else if (eventDate > now) {
        upcomingEvents.push(event)
      }
    })

    const todayCount = data.events.filter((e: CalendarEvent) => e.isToday).length

    return {
      past_events: pastEvents,
      upcoming_events: upcomingEvents,
      today_count: todayCount,
      week_count: upcomingEvents.length,
    }
  } catch (error) {
    console.error('Calendar context fetch error:', error)
    return null
  }
}

/**
 * Fetch recent emails (last 24h)
 */
async function fetchEmailContext(userId: string): Promise<AgentEmailContext | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gmail?maxResults=10`, {
      headers: { 'X-User-ID': userId },
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data.threads) return null

    const unreadCount = data.threads.filter((t: any) => t.unread).length

    return {
      unread_count: unreadCount,
      recent_threads: data.threads.slice(0, 5),
    }
  } catch (error) {
    console.error('Email context fetch error:', error)
    return null
  }
}

/**
 * Generate natural language summary from context
 */
function generateSummary(context: AgentContext): string {
  const parts: string[] = []

  // GitHub summary
  if (context.github) {
    const commitCount = context.github.recent_commits.length
    const prCount = context.github.pull_requests.filter(pr => pr.state === 'open').length
    const issueCount = context.github.issues.filter(i => i.state === 'open').length

    if (commitCount > 0) {
      parts.push(`${commitCount} commits in the last week`)
    }
    if (prCount > 0) {
      parts.push(`${prCount} open pull requests`)
    }
    if (issueCount > 0) {
      parts.push(`${issueCount} open issues`)
    }
  }

  // Calendar summary
  if (context.calendar) {
    if (context.calendar.today_count > 0) {
      parts.push(`${context.calendar.today_count} events today`)
    }
    if (context.calendar.upcoming_events.length > 0) {
      parts.push(`${context.calendar.upcoming_events.length} upcoming events this week`)
    }
  }

  // Email summary
  if (context.email && context.email.unread_count > 0) {
    parts.push(`${context.email.unread_count} unread emails`)
  }

  if (parts.length === 0) {
    return 'No recent activity from connected services.'
  }

  return parts.join(', ') + '.'
}
