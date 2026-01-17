/**
 * Notion Integration Client (Stub)
 */

import type { Event } from '@/types'

export async function getNotionUpdates(workspaceId: string): Promise<Event[]> {
    const token = process.env.NOTION_TOKEN
    if (!token) return []

    // TODO: Implement Notion API calls
    // - POST /v1/search (recently edited)
    // - GET /v1/databases/{id}/query

    return []
}
