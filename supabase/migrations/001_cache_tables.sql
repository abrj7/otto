-- Otto Cache Tables
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Stores sync tokens per user per provider (Gmail historyId, Calendar syncToken, GitHub last_fetched_at)
CREATE TABLE IF NOT EXISTS user_sync_state (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,          -- 'gmail', 'calendar', 'github'
    sync_token TEXT,                 -- provider-specific sync cursor
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, provider)
);

-- Stores individual cached items (each email, event, commit, repo is its own row)
CREATE TABLE IF NOT EXISTS user_cached_items (
    id TEXT NOT NULL,                -- Gmail message ID, Calendar event ID, commit SHA, repo full_name
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,          -- 'gmail', 'calendar', 'github'
    item_type TEXT NOT NULL,         -- 'email', 'event', 'commit', 'pr', 'issue', 'repo'
    data JSONB NOT NULL,             -- the actual item payload
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id, provider)
);

-- Fast lookups by user + provider + type
CREATE INDEX IF NOT EXISTS idx_cached_items_lookup
ON user_cached_items(user_id, provider, item_type);

-- Fast cleanup of old items
CREATE INDEX IF NOT EXISTS idx_cached_items_updated
ON user_cached_items(updated_at);

-- Enable RLS (service role key bypasses automatically)
ALTER TABLE user_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cached_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own cached data
CREATE POLICY "Users read own sync state" ON user_sync_state
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own cached items" ON user_cached_items
    FOR SELECT USING (auth.uid() = user_id);
