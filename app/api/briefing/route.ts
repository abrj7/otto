import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all connected integrations for this user
    const { data: integrations, error: integrationError } = await supabase
        .from('user_integrations')
        .select('provider')
        .eq('user_id', user.id)

    const connectedProviders = integrations?.map(i => i.provider) || []

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Fetch data from all services in parallel - get FULL data for detailed briefing
    const [gmailRes, calendarRes, githubReposRes] = await Promise.allSettled([
        connectedProviders.includes('google')
            ? fetch(`${baseUrl}/api/agent/gmail?user_id=${user.id}&limit=10&full=true`) // Full emails
            : Promise.reject('not connected'),
        connectedProviders.includes('google')
            ? fetch(`${baseUrl}/api/agent/calendar?user_id=${user.id}&timeframe=week`) // Full week
            : Promise.reject('not connected'),
        connectedProviders.includes('github')
            ? fetch(`${baseUrl}/api/agent/github?user_id=${user.id}`)
            : Promise.reject('not connected'),
    ])

    // Parse responses
    const gmail = gmailRes.status === 'fulfilled' && gmailRes.value.ok
        ? await gmailRes.value.json()
        : null
    const calendar = calendarRes.status === 'fulfilled' && calendarRes.value.ok
        ? await calendarRes.value.json()
        : null
    const githubRepos = githubReposRes.status === 'fulfilled' && githubReposRes.value.ok
        ? await githubReposRes.value.json()
        : null

    // Fetch detailed GitHub activity for active repos
    let githubDetails = null
    if (githubRepos?.repos?.length > 0) {
        const activeRepo = githubRepos.repos[0] // Most recently updated
        const [owner, repo] = activeRepo.fullName.split('/')

        const detailsRes = await fetch(
            `${baseUrl}/api/github?action=details&owner=${owner}&repo=${repo}`
        )
        if (detailsRes.ok) {
            githubDetails = await detailsRes.json()
        }
    }

    // Build comprehensive summary
    const summaryParts: string[] = []
    const sections: any[] = []

    // === CALENDAR SECTION ===
    if (calendar?.events?.length > 0) {
        const todayEvents = calendar.events.filter((e: any) => {
            const eventDate = new Date(e.start).toDateString()
            const today = new Date().toDateString()
            return eventDate === today
        })

        const nextEvent = calendar.events[0]
        const eventTime = new Date(nextEvent.start)
        const hoursUntil = (eventTime.getTime() - new Date().getTime()) / (1000 * 60 * 60)

        summaryParts.push(
            `You have a meeting coming up in about ${Math.round(hoursUntil * 10) / 10} hours - ${nextEvent.title} at ${formatTime(eventTime)}${nextEvent.location ? ` with ${nextEvent.location}` : ''}.`
        )

        // Detailed calendar section
        sections.push({
            title: 'Upcoming Meetings',
            items: calendar.events.slice(0, 5).map((event: any) => ({
                title: event.title,
                time: formatTime(new Date(event.start)),
                location: event.location,
                description: event.description,
            }))
        })
    }

    // === EMAIL SECTION ===
    if (gmail?.messages?.length > 0) {
        const unreadEmails = gmail.messages.filter((m: any) => m.unread)

        if (unreadEmails.length > 0) {
            summaryParts.push(`You have ${unreadEmails.length} unread emails.`)

            // Find important emails
            const importantKeywords = ['urgent', 'important', 'asap', 'deadline', 'review', 'feedback']
            const importantEmails = unreadEmails.filter((e: any) =>
                importantKeywords.some(kw =>
                    e.subject.toLowerCase().includes(kw) ||
                    e.body?.toLowerCase().includes(kw)
                )
            )

            if (importantEmails.length > 0) {
                const firstImportant = importantEmails[0]
                summaryParts.push(
                    `${firstImportant.from} sent an important message about "${firstImportant.subject}".`
                )
            }
        }

        // Detailed email section - last 10 emails with summaries
        sections.push({
            title: 'Recent Emails',
            items: gmail.messages.slice(0, 10).map((email: any) => ({
                from: email.from,
                subject: email.subject,
                snippet: email.snippet,
                body: email.body ? email.body.substring(0, 300) : email.snippet,
                timeAgo: email.timeAgo,
                unread: email.unread,
            }))
        })
    }

    // === GITHUB SECTION ===
    if (githubDetails) {
        const repoName = githubDetails.repo?.name || 'your repo'
        const commits = githubDetails.commits || []
        const prs = githubDetails.pullRequests || []

        if (commits.length > 0 || prs.length > 0) {
            summaryParts.push(
                `Your ${repoName} team has been busy - they've got ${commits.length} recent commits and ${prs.length} open pull requests.`
            )
        }

        // Detailed GitHub section
        sections.push({
            title: `GitHub Activity - ${repoName}`,
            items: [
                ...commits.slice(0, 5).map((commit: any) => ({
                    type: 'commit',
                    author: commit.author,
                    message: commit.message,
                    timeAgo: commit.timeAgo,
                })),
                ...prs.slice(0, 3).map((pr: any) => ({
                    type: 'pull_request',
                    title: pr.title,
                    author: pr.author,
                    state: pr.state,
                }))
            ]
        })
    } else if (githubRepos?.repos?.length > 0) {
        summaryParts.push(
            `You're working on ${githubRepos.repos.length} active repositories.`
        )

        sections.push({
            title: 'Active Repositories',
            items: githubRepos.repos.slice(0, 5).map((repo: any) => ({
                name: repo.name,
                description: repo.description,
                updatedAt: new Date(repo.updatedAt).toLocaleDateString(),
            }))
        })
    }

    // === PRIORITY RECOMMENDATION ===
    if (calendar?.events?.length > 0) {
        const nextEvent = calendar.events[0]
        summaryParts.push(
            `I'd prioritize prepping for the ${nextEvent.title} meeting.`
        )

        if (calendar.events.length === 1) {
            summaryParts.push('The day looks manageable with just the one meeting.')
        } else {
            summaryParts.push(`You have ${calendar.events.length} meetings scheduled this week.`)
        }
    }

    const summary = summaryParts.join(' ') ||
        (connectedProviders.length === 0
            ? "Connect your services to get personalized briefings."
            : "All caught up! No new updates from your connected services.")

    return NextResponse.json({
        connectedServices: connectedProviders,
        summary,
        sections, // Detailed breakdown for display
        stats: {
            unreadEmails: gmail?.messages?.filter((m: any) => m.unread).length || 0,
            todayMeetings: calendar?.events?.filter((e: any) => {
                const eventDate = new Date(e.start).toDateString()
                const today = new Date().toDateString()
                return eventDate === today
            }).length || 0,
            activeRepos: githubRepos?.repos?.length || 0,
        }
    })
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}
