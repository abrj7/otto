/**
 * Context Aggregator
 * Fetches and combines data from all integrations
 */

import type { Event, IntegrationType } from '@/types'
import { getGitHubActivity } from '@/lib/integrations/github'
import { getSlackMentions } from '@/lib/integrations/slack'
import { getTeamsMessages } from '@/lib/integrations/teams'
import { getNotionUpdates } from '@/lib/integrations/notion'
import { getGmailEmails } from '@/lib/integrations/gmail'
import { getCalendarEvents } from '@/lib/integrations/calendar'
import { getLinearIssues } from '@/lib/integrations/linear'
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

    // Fetch from all sources in parallel
    const results = await Promise.allSettled([
        getGitHubActivity(workspaceId, intent),
        getSlackMentions(workspaceId),
        getTeamsMessages(workspaceId),
        getNotionUpdates(workspaceId),
        getGmailEmails(workspaceId),
        getCalendarEvents(workspaceId),
        getLinearIssues(workspaceId),
    ])

    const sourceTypes: IntegrationType[] = [
        'github',
        'slack',
        'teams',
        'notion',
        'gmail',
        'calendar',
        'linear',
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
