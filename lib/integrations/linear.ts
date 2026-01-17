/**
 * Linear Integration Client (Stub)
 */

import type { Event } from '@/types'

const LINEAR_API = 'https://api.linear.app/graphql'

export async function getLinearIssues(workspaceId: string): Promise<Event[]> {
    const apiKey = process.env.LINEAR_API_KEY
    if (!apiKey) return []

    // TODO: Implement Linear GraphQL API calls
    // Query assigned issues, project updates, cycle progress

    return []
}

export async function getAssignedIssues(userId: string): Promise<Event[]> {
    // TODO: Query issues assigned to user
    return []
}
