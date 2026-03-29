/**
 * GitHub OAuth Token Utility
 * Gets a valid GitHub access token for a user
 * (GitHub OAuth tokens don't expire unless revoked, so simpler than Google)
 */

import { supabaseAdmin } from '@/lib/supabase/admin'

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
