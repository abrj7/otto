import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Admin client for DB operations (bypasses RLS)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// DELETE - Disconnect an integration
export async function DELETE(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const provider = searchParams.get('provider')

    if (!provider) {
        return NextResponse.json({ error: 'Provider required' }, { status: 400 })
    }

    // Delete the integration from database
    const { error } = await supabaseAdmin
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider)

    if (error) {
        console.error('Error disconnecting integration:', error)
        return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        message: `${provider} disconnected successfully`
    })
}
