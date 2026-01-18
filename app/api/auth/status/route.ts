import { NextResponse } from 'next/server'
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

export async function GET() {
    // Get real user from session
    const user = await getAuthUser()

    if (!user) {
        return NextResponse.json({ connected: [] })
    }

    const { data, error } = await supabaseAdmin
        .from('user_integrations')
        .select('provider')
        .eq('user_id', user.id)

    if (error) {
        console.error('Error fetching integrations:', error)
        return NextResponse.json({ connected: [] })
    }

    const connectedProviders = data?.map((row) => row.provider) || []

    return NextResponse.json({ connected: connectedProviders })
}
