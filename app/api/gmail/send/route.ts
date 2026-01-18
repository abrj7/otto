import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Admin client for DB operations (bypasses RLS)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Send an email via Gmail API
export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // Get user - either from session cookie OR from X-User-ID header (for agent)
    let userId: string | null = null

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        userId = user.id
    } else {
        // Fallback to X-User-ID header (used by voice agent)
        userId = request.headers.get('X-User-ID')
    }

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Google token from user_integrations
    const { data: integration } = await supabaseAdmin
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single()

    if (!integration?.access_token) {
        return NextResponse.json({
            error: 'Gmail not connected',
            connected: false
        }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { to, subject, body: emailBody } = body

        if (!to || !subject || !emailBody) {
            return NextResponse.json({
                error: 'Missing required fields: to, subject, body'
            }, { status: 400 })
        }

        // Construct RFC 2822 formatted email
        const email = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'Content-Type: text/plain; charset=utf-8',
            '',
            emailBody
        ].join('\r\n')

        // Base64 URL-safe encode
        const encodedEmail = Buffer.from(email)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')

        const response = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${integration.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    raw: encodedEmail
                }),
            }
        )

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Gmail send error:', errorData)
            return NextResponse.json({
                error: 'Failed to send email',
                details: errorData
            }, { status: response.status })
        }

        const sentMessage = await response.json()

        return NextResponse.json({
            success: true,
            messageId: sentMessage.id
        }, { status: 201 })

    } catch (err) {
        console.error('Gmail Send Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
