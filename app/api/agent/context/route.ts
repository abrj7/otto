/**
 * Agent Context API
 * GET /api/agent/context
 * Returns aggregated context packet for the voice agent
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { buildUserContext } from '@/lib/aggregator/contextBuilder'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // Don't cache - always fresh data

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Get user - either from session cookie OR from X-User-ID header (for agent)
  let userId: string | null = null
  let userEmail: string | undefined

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    userId = user.id
    userEmail = user.email
  } else {
    // Fallback to X-User-ID header (used by voice agent)
    userId = request.headers.get('X-User-ID')
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Build the context packet
    const result = await buildUserContext(userId, userEmail)

    if (!result.success || !result.context) {
      return NextResponse.json(
        { error: result.error || 'Failed to build context' },
        { status: 500 }
      )
    }

    // Add cache control headers to prevent caching
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    })

    return NextResponse.json(result.context, { headers })
  } catch (error) {
    console.error('Agent context API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
