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

    // Aggregate data from connected services
    const briefingData: any = {
        connectedServices: connectedProviders,
        calendar: null,
        github: null,
        summary: '',
        insights: [],
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Fetch Calendar data if connected
    if (connectedProviders.includes('google')) {
        try {
            const calendarRes = await fetch(`${baseUrl}/api/calendar`, {
                headers: {
                    cookie: '', // Will be handled by Supabase session in the API route
                },
            })
            if (calendarRes.ok) {
                const calendarData = await calendarRes.json()
                briefingData.calendar = calendarData.events?.slice(0, 5) || []
            }
        } catch (err) {
            console.error('Failed to fetch calendar for briefing:', err)
        }
    }

    // Fetch GitHub data if connected
    if (connectedProviders.includes('github')) {
        try {
            const githubRes = await fetch(`${baseUrl}/api/github`, {
                headers: {
                    cookie: '',
                },
            })
            if (githubRes.ok) {
                const githubData = await githubRes.json()
                briefingData.github = githubData.events?.slice(0, 5) || []
            }
        } catch (err) {
            console.error('Failed to fetch github for briefing:', err)
        }
    }

    // Generate summary
    const parts: string[] = []

    if (briefingData.calendar?.length) {
        const todayEvents = briefingData.calendar.filter((e: any) => e.isToday)
        if (todayEvents.length > 0) {
            parts.push(`You have ${todayEvents.length} event${todayEvents.length !== 1 ? 's' : ''} today`)
        }
    }

    if (briefingData.github?.length) {
        parts.push(`${briefingData.github.length} recent GitHub activities`)
    }

    if (parts.length === 0) {
        if (connectedProviders.length === 0) {
            briefingData.summary = "Connect your services to get personalized briefings."
        } else {
            briefingData.summary = "All caught up! No new updates from your connected services."
        }
    } else {
        briefingData.summary = parts.join('. ') + '.'
    }

    // Build insights from all sources
    if (briefingData.calendar) {
        briefingData.insights.push(...briefingData.calendar.map((event: any) => ({
            id: event.id,
            type: 'calendar',
            title: event.title,
            subtitle: event.isToday ? `Today at ${event.time}` : `${event.date} at ${event.time}`,
            source: 'Google Calendar',
        })))
    }

    if (briefingData.github) {
        briefingData.insights.push(...briefingData.github.map((event: any) => ({
            id: event.id,
            type: 'github',
            title: event.title,
            subtitle: event.timeAgo,
            source: 'GitHub',
        })))
    }

    return NextResponse.json(briefingData)
}
