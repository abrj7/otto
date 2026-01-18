/**
 * Zoom Integration Client
 */

import type { Event } from '@/types'

const ZOOM_API = 'https://api.zoom.us/v2'

interface ZoomMeeting {
    id: number
    topic: string
    start_time: string
    duration: number
    join_url: string
    status: string
}

export async function getZoomMeetings(accessToken: string): Promise<Event[]> {
    if (!accessToken) return []

    const events: Event[] = []
    const headers = {
        Authorization: `Bearer ${accessToken}`,
    }

    try {
        // Fetch upcoming meetings
        const meetingsRes = await fetch(`${ZOOM_API}/users/me/meetings?type=upcoming`, { headers })
        if (meetingsRes.ok) {
            const { meetings }: { meetings: ZoomMeeting[] } = await meetingsRes.json()

            for (const meeting of meetings.slice(0, 5)) {
                events.push({
                    id: `zoom-meeting-${meeting.id}`,
                    workspace_id: 'demo',
                    integration_type: 'zoom',
                    event_type: 'meeting',
                    actor: null,
                    title: meeting.topic,
                    body: `Duration: ${meeting.duration} minutes`,
                    url: meeting.join_url,
                    metadata: {
                        duration: meeting.duration,
                        status: meeting.status,
                    },
                    occurred_at: meeting.start_time,
                    created_at: new Date().toISOString(),
                })
            }
        }
    } catch (error) {
        console.error('Zoom API error:', error)
    }

    return events
}
