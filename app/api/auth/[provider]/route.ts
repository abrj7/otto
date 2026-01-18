import { NextRequest, NextResponse } from 'next/server'

const OAUTH_CONFIGS: Record<string, {
    authUrl: string
    clientIdEnv: string
    scopes: string[]
    extraParams?: Record<string, string>
}> = {
    github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        clientIdEnv: 'GITHUB_CLIENT_ID',
        scopes: ['read:user', 'user:email', 'repo'],
    },
    google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        clientIdEnv: 'GOOGLE_CLIENT_ID',
        scopes: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/calendar.readonly',
        ],
        extraParams: {
            access_type: 'offline',
            prompt: 'consent',
        },
    },
    notion: {
        authUrl: 'https://api.notion.com/v1/oauth/authorize',
        clientIdEnv: 'NOTION_CLIENT_ID',
        scopes: [],
        extraParams: {
            owner: 'user',
        },
    },
    linkedin: {
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        clientIdEnv: 'LINKEDIN_CLIENT_ID',
        scopes: ['openid', 'profile', 'email'],
    },
    zoom: {
        authUrl: 'https://zoom.us/oauth/authorize',
        clientIdEnv: 'ZOOM_CLIENT_ID',
        scopes: [],
    },
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params

    const config = OAUTH_CONFIGS[provider]
    if (!config) {
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    const clientId = process.env[config.clientIdEnv]
    if (!clientId) {
        return NextResponse.json({ error: 'Provider not configured' }, { status: 500 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/${provider}`

    const params_obj = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state: crypto.randomUUID(), // CSRF protection
        ...config.extraParams,
    })

    const authUrl = `${config.authUrl}?${params_obj.toString()}`

    return NextResponse.redirect(authUrl)
}
