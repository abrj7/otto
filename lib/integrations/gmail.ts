/**
 * Gmail Integration Client
 */

import type { Event } from '@/types'

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

interface GmailMessage {
    id: string
    threadId: string
    snippet: string
    internalDate: string
    payload: {
        headers: Array<{ name: string; value: string }>
    }
}

export async function getGmailMessages(accessToken: string, workspaceId: string): Promise<Event[]> {
    if (!accessToken) return []

    const events: Event[] = []
    const headers = {
        Authorization: `Bearer ${accessToken}`,
    }

    try {
        // Fetch recent messages
        const listRes = await fetch(
            `${GMAIL_API}/users/me/messages?maxResults=10&q=is:unread OR is:important`,
            { headers }
        )

        if (!listRes.ok) return []

        const { messages } = await listRes.json()
        if (!messages) return []

        // Fetch each message details
        for (const msg of messages.slice(0, 5)) {
            const msgRes = await fetch(
                `${GMAIL_API}/users/me/messages/${msg.id}?format=metadata`,
                { headers }
            )

            if (!msgRes.ok) continue

            const message: GmailMessage = await msgRes.json()
            const getHeader = (name: string) =>
                message.payload.headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value

            events.push({
                id: message.id,
                workspace_id: workspaceId,
                integration_type: 'gmail',
                event_type: 'email',
                actor: getHeader('From') || null,
                title: getHeader('Subject') || '(No subject)',
                body: message.snippet,
                url: `https://mail.google.com/mail/#all/${message.id}`,
                metadata: {
                    threadId: message.threadId,
                    date: getHeader('Date'),
                },
                occurred_at: new Date(parseInt(message.internalDate)).toISOString(),
                created_at: new Date().toISOString(),
            })
        }
    } catch (error) {
        console.error('Gmail API error:', error)
    }

    return events
}
