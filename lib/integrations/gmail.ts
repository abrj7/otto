/**
 * Gmail Integration Client (Stub)
 */

import type { Event } from '@/types'

export async function getGmailEmails(workspaceId: string): Promise<Event[]> {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) return []

    // TODO: Implement Gmail API calls
    // - GET /gmail/v1/users/me/messages
    // - Requires OAuth token

    return []
}

export async function getUrgentEmails(workspaceId: string): Promise<Event[]> {
    // TODO: Filter for high-priority emails
    return []
}
