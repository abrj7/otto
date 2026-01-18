import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Admin client for DB operations (bypasses RLS)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Google token from user_integrations using admin client
    const { data: integration } = await supabaseAdmin
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single()

    if (!integration?.access_token) {
        return NextResponse.json({
            error: 'Gmail not connected',
            connected: false
        }, { status: 400 })
    }

    try {
        // Fetch messages from Gmail API
        const response = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX',
            {
                headers: {
                    Authorization: `Bearer ${integration.access_token}`,
                },
            }
        )

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json({
                error: 'Gmail API error',
                details: errorData
            }, { status: response.status })
        }

        const data = await response.json()
        const messageIds = data.messages || []

        // Fetch details for each message (in parallel)
        const messageDetails = await Promise.all(
            messageIds.slice(0, 10).map(async (msg: any) => {
                const detailResponse = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
                    {
                        headers: {
                            Authorization: `Bearer ${integration.access_token}`,
                        },
                    }
                )
                return detailResponse.json()
            })
        )

        // Format messages for UI
        const formattedMessages = messageDetails.map((msg: any) => {
            const headers = msg.payload?.headers || []
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown'
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(no subject)'
            const date = headers.find((h: any) => h.name === 'Date')?.value || ''

            // Extract email and name from "Name <email@example.com>" format
            const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/)
            const senderName = fromMatch ? fromMatch[1].replace(/"/g, '') : from
            const senderEmail = fromMatch ? fromMatch[2] : from

            return {
                id: msg.id,
                from: senderName,
                email: senderEmail,
                subject,
                snippet: msg.snippet || '',
                date,
                timeAgo: getTimeAgo(new Date(date)),
                unread: msg.labelIds?.includes('UNREAD') || false,
            }
        })

        return NextResponse.json({
            messages: formattedMessages,
            connected: true
        })
    } catch (err) {
        console.error('Gmail Fetch Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return `${Math.floor(seconds / 604800)}w ago`
}
