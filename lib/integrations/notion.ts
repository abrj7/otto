/**
 * Notion Integration Client
 */

import type { Event } from '@/types'

const NOTION_API = 'https://api.notion.com/v1'

interface NotionPage {
    id: string
    url: string
    created_time: string
    last_edited_time: string
    properties: {
        title?: {
            title: Array<{ plain_text: string }>
        }
        Name?: {
            title: Array<{ plain_text: string }>
        }
    }
    created_by?: { id: string }
}

export async function getNotionPages(accessToken: string, workspaceId: string): Promise<Event[]> {
    if (!accessToken) return []

    const events: Event[] = []
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
    }

    try {
        // Search for recent pages
        const searchRes = await fetch(`${NOTION_API}/search`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                sort: {
                    direction: 'descending',
                    timestamp: 'last_edited_time',
                },
                page_size: 10,
            }),
        })

        if (!searchRes.ok) return []

        const { results } = await searchRes.json()
        if (!results) return []

        for (const page of results as NotionPage[]) {
            const titleProp = page.properties?.title || page.properties?.Name
            const title = titleProp?.title?.[0]?.plain_text || 'Untitled'

            events.push({
                id: page.id,
                workspace_id: workspaceId,
                integration_type: 'notion',
                event_type: 'page',
                actor: null,
                title,
                body: null,
                url: page.url,
                metadata: {
                    createdTime: page.created_time,
                    lastEditedTime: page.last_edited_time,
                },
                occurred_at: page.last_edited_time,
                created_at: new Date().toISOString(),
            })
        }
    } catch (error) {
        console.error('Notion API error:', error)
    }

    return events
}
