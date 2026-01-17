/**
 * Slack Integration Client (Stub)
 */

import type { Event } from '@/types'

export async function getSlackMentions(workspaceId: string): Promise<Event[]> {
    const token = process.env.SLACK_BOT_TOKEN
    if (!token) return []

    // TODO: Implement Slack API calls
    // - conversations.history
    // - Search for mentions of SLACK_USER_ID

    return []
}

export async function getSlackThread(
    channel: string,
    threadTs: string
): Promise<Event[]> {
    // TODO: Implement thread fetching
    return []
}
