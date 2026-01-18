/**
 * LinkedIn Integration Client
 */

import type { Event } from '@/types'

const LINKEDIN_API = 'https://api.linkedin.com/v2'

interface LinkedInProfile {
    id: string
    localizedFirstName: string
    localizedLastName: string
}

export async function getLinkedInProfile(accessToken: string): Promise<Event[]> {
    if (!accessToken) return []

    const events: Event[] = []
    const headers = {
        Authorization: `Bearer ${accessToken}`,
    }

    try {
        // Fetch user profile
        const profileRes = await fetch(`${LINKEDIN_API}/userinfo`, { headers })
        if (profileRes.ok) {
            const profile = await profileRes.json()
            events.push({
                id: `linkedin-profile-${profile.sub}`,
                workspace_id: 'demo',
                integration_type: 'linkedin',
                event_type: 'profile',
                actor: `${profile.name}`,
                title: `LinkedIn Profile: ${profile.name}`,
                body: profile.email || null,
                url: null,
                metadata: { email: profile.email, picture: profile.picture },
                occurred_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            })
        }
    } catch (error) {
        console.error('LinkedIn API error:', error)
    }

    return events
}
