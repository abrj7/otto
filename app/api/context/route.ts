import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // Fetch data from all APIs in parallel
        const [gmailRes, calendarRes, githubRes] = await Promise.allSettled([
            fetch(`${baseUrl}/api/gmail`, {
                headers: { Cookie: `sb-access-token=${user.id}` } // Pass auth
            }),
            fetch(`${baseUrl}/api/calendar?timeframe=today`, {
                headers: { Cookie: `sb-access-token=${user.id}` }
            }),
            fetch(`${baseUrl}/api/github?action=repos`, {
                headers: { Cookie: `sb-access-token=${user.id}` }
            })
        ])

        // Parse responses
        const gmail = gmailRes.status === 'fulfilled' && gmailRes.value.ok
            ? await gmailRes.value.json()
            : null
        const calendar = calendarRes.status === 'fulfilled' && calendarRes.value.ok
            ? await calendarRes.value.json()
            : null
        const github = githubRes.status === 'fulfilled' && githubRes.value.ok
            ? await githubRes.value.json()
            : null

        // Build summary
        const emailCount = gmail?.messages?.length || 0
        const unreadCount = gmail?.messages?.filter((m: any) => m.unread).length || 0
        const todayEvents = calendar?.events?.length || 0
        const nextEvent = calendar?.events?.[0]
        const activeRepos = github?.repos?.slice(0, 3).map((r: any) => r.name) || []

        const summary = buildSummary({
            unreadCount,
            todayEvents,
            nextEvent,
            activeRepos
        })

        return NextResponse.json({
            summary,
            email: {
                total: emailCount,
                unread_count: unreadCount,
                recent_subjects: gmail?.messages?.slice(0, 3).map((m: any) => m.subject) || []
            },
            calendar: {
                today_count: todayEvents,
                next_event: nextEvent ? {
                    title: nextEvent.title,
                    start: nextEvent.start,
                    timeUntil: getTimeUntil(new Date(nextEvent.start))
                } : null
            },
            github: {
                active_repos: activeRepos,
                repo_count: github?.repos?.length || 0
            }
        })
    } catch (err) {
        console.error('Context fetch error:', err)
        return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 })
    }
}

function buildSummary(data: {
    unreadCount: number
    todayEvents: number
    nextEvent: any
    activeRepos: string[]
}): string {
    const parts = []

    if (data.unreadCount > 0) {
        parts.push(`${data.unreadCount} unread email${data.unreadCount > 1 ? 's' : ''}`)
    }

    if (data.todayEvents > 0) {
        parts.push(`${data.todayEvents} meeting${data.todayEvents > 1 ? 's' : ''} today`)
    } else if (data.nextEvent) {
        const timeUntil = getTimeUntil(new Date(data.nextEvent.start))
        parts.push(`next meeting in ${timeUntil}`)
    }

    if (data.activeRepos.length > 0) {
        parts.push(`working on ${data.activeRepos.join(', ')}`)
    }

    if (parts.length === 0) {
        return "You're all caught up!"
    }

    return `You have ${parts.join(', ')}.`
}

function getTimeUntil(date: Date): string {
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`
    return 'soon'
}
