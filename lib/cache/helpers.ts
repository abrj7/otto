/**
 * Shared cache utilities for sync state and cached items
 */

import { supabaseAdmin } from '@/lib/supabase/admin'

// Cache TTLs in milliseconds
export const CACHE_TTL = {
    gmail: 5 * 60 * 1000,      // 5 minutes - email is time-sensitive
    calendar: 10 * 60 * 1000,  // 10 minutes - events rarely change fast
    github: 10 * 60 * 1000,    // 10 minutes - commits aren't instant
} as const

export type Provider = 'gmail' | 'calendar' | 'github'
export type ItemType = 'email' | 'event' | 'commit' | 'pr' | 'issue' | 'repo'

interface SyncState {
    sync_token: string | null
    last_synced_at: string
}

/**
 * Get the sync state for a user + provider
 */
export async function getSyncState(userId: string, provider: Provider): Promise<SyncState | null> {
    const { data } = await supabaseAdmin
        .from('user_sync_state')
        .select('sync_token, last_synced_at')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single()

    return data
}

/**
 * Update the sync state after a successful sync
 */
export async function setSyncState(userId: string, provider: Provider, syncToken: string | null): Promise<void> {
    await supabaseAdmin
        .from('user_sync_state')
        .upsert({
            user_id: userId,
            provider,
            sync_token: syncToken,
            last_synced_at: new Date().toISOString(),
        }, { onConflict: 'user_id,provider' })
}

/**
 * Check if the cache is stale based on TTL
 */
export function isCacheStale(lastSyncedAt: string, provider: Provider): boolean {
    const age = Date.now() - new Date(lastSyncedAt).getTime()
    return age > CACHE_TTL[provider]
}

/**
 * Get cached items for a user + provider, optionally filtered by type
 */
export async function getCachedItems(
    userId: string,
    provider: Provider,
    itemType?: ItemType,
    limit?: number
): Promise<any[]> {
    let query = supabaseAdmin
        .from('user_cached_items')
        .select('id, item_type, data, updated_at')
        .eq('user_id', userId)
        .eq('provider', provider)

    if (itemType) {
        query = query.eq('item_type', itemType)
    }

    query = query.order('updated_at', { ascending: false })

    if (limit) {
        query = query.limit(limit)
    }

    const { data } = await query
    return data || []
}

/**
 * Upsert a batch of items into the cache
 */
export async function upsertCachedItems(
    userId: string,
    provider: Provider,
    items: { id: string; item_type: ItemType; data: any }[]
): Promise<void> {
    if (items.length === 0) return

    const now = new Date().toISOString()
    const rows = items.map(item => ({
        id: item.id,
        user_id: userId,
        provider,
        item_type: item.item_type,
        data: item.data,
        updated_at: now,
    }))

    await supabaseAdmin
        .from('user_cached_items')
        .upsert(rows, { onConflict: 'id,user_id,provider' })
}

/**
 * Remove specific items from cache
 */
export async function removeCachedItems(userId: string, provider: Provider, ids: string[]): Promise<void> {
    if (ids.length === 0) return

    await supabaseAdmin
        .from('user_cached_items')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider)
        .in('id', ids)
}

/**
 * Invalidate all cached items for a user + provider (force full re-sync)
 */
export async function invalidateCache(userId: string, provider: Provider): Promise<void> {
    await Promise.all([
        supabaseAdmin
            .from('user_cached_items')
            .delete()
            .eq('user_id', userId)
            .eq('provider', provider),
        supabaseAdmin
            .from('user_sync_state')
            .delete()
            .eq('user_id', userId)
            .eq('provider', provider),
    ])
}

export function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return `${Math.floor(seconds / 604800)}w ago`
}
