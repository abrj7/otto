/**
 * GitHub OAuth Token Utility
 * Gets a valid GitHub access token for a user
 * (GitHub OAuth tokens don't expire unless revoked, so simpler than Google)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Get a valid GitHub access token for a user
 */
export async function getValidGithubToken(userId: string): Promise<string | null> {
    // Get current token from database
    const { data: integration } = await supabaseAdmin
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', userId)
        .eq('provider', 'github')
        .single()

    return integration?.access_token || null
}
