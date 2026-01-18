/**
 * LiveKit Token Route
 * POST /api/livekit/token
 */

import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function POST(req: NextRequest) {
    try {
        const { user_id, room_name } = await req.json()

        if (!user_id || !room_name) {
            return NextResponse.json(
                { error: 'Missing user_id or room_name' },
                { status: 400 }
            )
        }

        const apiKey = process.env.LIVEKIT_API_KEY
        const apiSecret = process.env.LIVEKIT_API_SECRET

        if (!apiKey || !apiSecret) {
            return NextResponse.json(
                { error: 'LiveKit not configured' },
                { status: 500 }
            )
        }

        const token = new AccessToken(apiKey, apiSecret, {
            identity: user_id,
            metadata: JSON.stringify({ user_id }) // Pass user_id to agent
        })

        token.addGrant({
            room: room_name,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
        })

        return NextResponse.json({
            token: await token.toJwt(),
        })
    } catch (error) {
        console.error('LiveKit token error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
