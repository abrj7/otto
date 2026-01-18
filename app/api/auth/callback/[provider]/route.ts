import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Admin client for DB operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get authenticated user from session
async function getAuthUser() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { }
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    return user
}

interface TokenResponse {
    access_token: string
    refresh_token?: string
    expires_in?: number
    token_type: string
}

const OAUTH_CONFIGS: Record<string, {
    tokenUrl: string
    clientIdEnv: string
    clientSecretEnv: string
    extraParams?: Record<string, string>
}> = {
    github: {
        tokenUrl: 'https://github.com/login/oauth/access_token',
        clientIdEnv: 'GITHUB_CLIENT_ID',
        clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    },
    google: {
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    },
    notion: {
        tokenUrl: 'https://api.notion.com/v1/oauth/token',
        clientIdEnv: 'NOTION_CLIENT_ID',
        clientSecretEnv: 'NOTION_CLIENT_SECRET',
    },
    linkedin: {
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        clientIdEnv: 'LINKEDIN_CLIENT_ID',
        clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
    },
    zoom: {
        tokenUrl: 'https://zoom.us/oauth/token',
        clientIdEnv: 'ZOOM_CLIENT_ID',
        clientSecretEnv: 'ZOOM_CLIENT_SECRET',
    },
}

async function exchangeCodeForToken(
    provider: string,
    code: string,
    redirectUri: string
): Promise<TokenResponse> {
    const config = OAUTH_CONFIGS[provider]

    const clientId = process.env[config.clientIdEnv]!
    const clientSecret = process.env[config.clientSecretEnv]!

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
    })

    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }

    // Notion requires Basic auth
    if (provider === 'notion') {
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        headers['Authorization'] = `Basic ${basicAuth}`
    }

    // GitHub needs Accept header for JSON
    if (provider === 'github') {
        headers['Accept'] = 'application/json'
    }

    // Zoom requires Basic auth
    if (provider === 'zoom') {
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        headers['Authorization'] = `Basic ${basicAuth}`
    }

    const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers,
        body: body.toString(),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error(`Token exchange failed for ${provider}:`, errorText)
        throw new Error(`Token exchange failed: ${errorText}`)
    }

    return response.json()
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        console.error(`OAuth error for ${provider}:`, error)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding?error=${error}`
        )
    }

    if (!code) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding?error=no_code`
        )
    }

    const config = OAUTH_CONFIGS[provider]
    if (!config) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding?error=invalid_provider`
        )
    }

    try {
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/${provider}`
        const tokenData = await exchangeCodeForToken(provider, code, redirectUri)

        // Get real user ID from session
        const user = await getAuthUser()
        if (!user) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?error=not_authenticated`
            )
        }
        const userId = user.id

        // Calculate token expiration
        const expiresAt = tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null

        // Upsert the integration using admin client
        const { error: dbError } = await supabaseAdmin
            .from('user_integrations')
            .upsert({
                user_id: userId,
                provider,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token || null,
                token_expires_at: expiresAt,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,provider',
            })

        if (dbError) {
            console.error('Database error:', dbError)
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding?error=db_error`
            )
        }

        // Redirect back to onboarding with success
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding?connected=${provider}`
        )
    } catch (err) {
        console.error(`OAuth callback error for ${provider}:`, err)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding?error=token_exchange_failed`
        )
    }
}
