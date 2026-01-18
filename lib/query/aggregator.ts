/**
 * Context Aggregator
 * Fetches and combines data from all integrations
 */

import type { Event, IntegrationType } from '@/types'
import { getGitHubActivity } from '@/lib/integrations/github'
import { getSlackMentions } from '@/lib/integrations/slack'
import { getNotionPages } from '@/lib/integrations/notion'
import { getGmailMessages } from '@/lib/integrations/gmail'
import { getCalendarEvents } from '@/lib/integrations/calendar'
import { getLinkedInProfile } from '@/lib/integrations/linkedin'
import { getZoomMeetings } from '@/lib/integrations/zoom'
import type { Intent } from './intents'

export interface AggregatedContext {
    events: Event[]
    textContext: string
    sources: IntegrationType[]
}

export async function aggregateContext(
    intent: Intent,
    workspaceId: string
): Promise<AggregatedContext> {
    const allEvents: Event[] = []
    const sources: IntegrationType[] = []

    // For now, using empty strings for OAuth tokens
    // In production, these would come from the user's stored tokens in Supabase
    const githubToken = process.env.GITHUB_TOKEN || ''
    const googleToken = '' // Would come from user_integrations table
    const notionToken = ''
    const linkedInToken = ''
    const zoomToken = ''

    // Fetch from all sources in parallel
    const results = await Promise.allSettled([
        getGitHubActivity(workspaceId, intent),
        getSlackMentions(workspaceId),
        getNotionPages(notionToken, workspaceId),
        getGmailMessages(googleToken, workspaceId),
        getCalendarEvents(googleToken, workspaceId),
        getLinkedInProfile(linkedInToken),
        getZoomMeetings(zoomToken),
    ])

    const sourceTypes: IntegrationType[] = [
        'github',
        'slack',
        'notion',
        'gmail',
        'calendar',
        'linkedin',
        'zoom',
    ]

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
            allEvents.push(...result.value)
            sources.push(sourceTypes[index])
        }
    })

    // Sort by recency
    allEvents.sort(
        (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    )

    // Convert to text for LLM
    const textContext = eventsToText(allEvents)

    return {
        events: allEvents,
        textContext,
        sources,
    }
}

function eventsToText(events: Event[]): string {
    return events
        .map((event) => {
            const time = new Date(event.occurred_at).toLocaleString()
            return `[${event.integration_type}] ${event.event_type} by ${event.actor || 'unknown'} at ${time}: ${event.title || ''}`
        })
        .join('\n')
}
