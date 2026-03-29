/**
 * Shared Supabase Admin Client
 * Single instance used by all server-side code (cache, auth, agent routes)
 * Uses service role key to bypass RLS
 */

import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)
