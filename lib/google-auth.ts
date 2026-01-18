/**
 * Google OAuth Token Refresh Utility
 * Handles automatic token refresh for expired Google Access Tokens
 */

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TokenData {
    access_token: string
    refresh_token: string | null
    token_expires_at: string | null
}

/**
 * Get a valid Google access token for a user
 * Automatically refreshes if expired and refresh token is available
 */
export async function getValidGoogleToken(userId: string): Promise<string | null> {
    // Get current token from database
    const { data: integration } = await supabaseAdmin
        .from('user_integrations')
        .select('access_token, refresh_token, token_expires_at')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single()

    if (!integration?.access_token) {
        return null
    }

    // Check if token is expired (with 5 min buffer)
    const isExpired = integration.token_expires_at &&
        new Date(integration.token_expires_at).getTime() < Date.now() + 5 * 60 * 1000

    if (!isExpired) {
        return integration.access_token
    }

    // Token is expired - try to refresh
    if (!integration.refresh_token) {
        console.log('Token expired and no refresh token available')
        return null
    }

    console.log('Refreshing expired Google token for user:', userId)

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: integration.refresh_token,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            }),
        })

        if (!response.ok) {
            console.error('Token refresh failed:', await response.text())
            return null
        }

        const data = await response.json()

        // Update database with new token
        const expiresAt = data.expires_in
            ? new Date(Date.now() + data.expires_in * 1000).toISOString()
            : null

        await supabaseAdmin
            .from('user_integrations')
            .update({
                access_token: data.access_token,
                token_expires_at: expiresAt,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('provider', 'google')

        console.log('Token refreshed successfully')
        return data.access_token
    } catch (error) {
        console.error('Token refresh error:', error)
        return null
    }
}
