/**
 * LiveKit Token Route
 * POST /api/livekit/token
 *
 * Gets user ID from Supabase session (cookie auth) or falls back to body param
 */

import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { room_name } = body

        if (!room_name) {
            return NextResponse.json(
                { error: 'Missing room_name' },
                { status: 400 }
            )
        }

        // Try to get authenticated user from Supabase session
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Use authenticated user ID, or fallback to body param for guests
        const userId = user?.id || body.user_id || `guest-${Date.now()}`
        const userName = user?.user_metadata?.full_name || user?.email || userId

        const apiKey = process.env.LIVEKIT_API_KEY
        const apiSecret = process.env.LIVEKIT_API_SECRET

        if (!apiKey || !apiSecret) {
            return NextResponse.json(
                { error: 'LiveKit not configured' },
                { status: 500 }
            )
        }

        const token = new AccessToken(apiKey, apiSecret, {
            identity: userId,
            name: userName,  // Display name for the agent
            metadata: JSON.stringify({
                user_id: userId,
                authenticated: !!user,
            }),
        })

        token.addGrant({
            room: room_name,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
        })

        return NextResponse.json({
            token: await token.toJwt(),
            room_name,
            user_id: userId,
        })
    } catch (error) {
        console.error('LiveKit token error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
