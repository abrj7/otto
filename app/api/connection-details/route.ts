/**
 * LiveKit Connection Details API
 * POST /api/connection-details
 * Returns connection details for LiveKit room
 * Uses authenticated Supabase user ID so the agent can access their integrations
 */

import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// Don't cache the results
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use real user ID if logged in, otherwise generate guest ID
    const userId = user?.id || `guest_${Math.floor(Math.random() * 10_000)}`;
    const participantName = user?.email || user?.user_metadata?.full_name || 'Guest';
    const roomName = `otto_room_${Math.floor(Math.random() * 10_000)}`;

    console.log(`🔑 Creating LiveKit token for user: ${userId}`);

    const participantToken = await createParticipantToken(
      {
        identity: userId,  // This is what the agent uses to call APIs
        name: participantName,
        metadata: JSON.stringify({ user_id: userId }),
      },
      roomName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };

    const headers = new Headers({
      'Cache-Control': 'no-store',
    });

    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  return at.toJwt();
}
