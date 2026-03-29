# Otto Optimization Plan: Scaling from Hackathon to Production

## Current State: What's Wrong

### The API Call Explosion

Every time a user interacts with Otto, here's the actual HTTP request count:

| Action | External API Calls | Internal Calls | Total |
|--------|-------------------|----------------|-------|
| **User says "check my GitHub"** | 1 (`/user`) + 1 (`/user/repos`) + 2 per repo × 3 repos = **8** | 1 (`/api/github`) | **9** |
| **User says "check my email"** | 1 (list messages) + 1 per message × 10 = **11** | 1 (`/api/gmail`) | **12** |
| **User says "check my calendar"** | **1** | 1 (`/api/calendar`) | **2** |
| **Dashboard briefing loads** | 8 + 11 + 1 = **20** (above) + 1 TTC + 1 Gemini = **22** | 3 internal fetches | **25** |
| **Page reload (dashboard)** | All of the above re-fire | - | **25+** |
| **New LiveKit room** | 1 Supabase auth check | 1 POST `/api/connection-details` | **2** |

**Worst case per session**: A user opens the dashboard (25 calls), asks Otto about GitHub (9), email (12), and calendar (2) = **~48 external API calls in a single session**. Every reload repeats the 25.

### The Five Root Causes

1. **Zero data-layer caching** - The `/api/github`, `/api/gmail`, and `/api/calendar` routes hit external APIs on every single request. Only the briefing endpoint has a 15-min cache.

2. **N+1 query pattern in Gmail** - Lists message IDs (1 call), then fetches each message individually (N calls). Same pattern in GitHub details (fetches each commit's patch individually).

3. **New LiveKit room per click** - Every mic button press creates a brand new room (`otto_room_{random}`). The agent has to reconnect, re-initialize Gemini Realtime, and reload Silero VAD every time.

4. **Agent tools call internal API routes over HTTP** - The Python agent makes HTTP requests to `localhost:3000/api/*` which then make HTTP requests to external APIs. Double network hop for every tool call.

5. **Briefing fetches everything from scratch** - Even though data was just fetched for the dashboard UI, the briefing endpoint re-fetches all the same data through its own internal routes.

---

## Proposed Solutions (Ranked by Effort vs. Impact)

### Option 1: Server-Side Data Cache Layer (Supabase or Redis)

**What**: Add a per-user cache table in Supabase (or Redis if you add it) that stores fetched GitHub/Gmail/Calendar data with TTLs.

**How it works**:
```
User request → Check cache (Supabase table) → If fresh, return cached → If stale, fetch from API, update cache, return
```

**Cache TTLs by data type**:
| Data | TTL | Rationale |
|------|-----|-----------|
| GitHub repos list | 1 hour | Repos don't change frequently |
| GitHub commits/PRs | 10 minutes | Commits happen more often but not every minute |
| Gmail messages | 5 minutes | Email is more time-sensitive |
| Calendar events | 10 minutes | Events rarely change within minutes |
| Briefing | 30 minutes (bump from 15) | Briefing content is a synthesis, not raw data |

**Implementation**: A single `user_data_cache` table in Supabase:
```
user_id | data_type | data (jsonb) | fetched_at | expires_at
```

**Pros**:
- Eliminates 80%+ of external API calls immediately
- Cache survives server restarts (unlike current in-memory Maps)
- Shared between dashboard UI and agent tools (fetch once, serve both)
- Uses infrastructure you already pay for (Supabase)
- Can be implemented incrementally, one route at a time

**Cons**:
- Adds ~50ms latency per cache read (Supabase query) — negligible vs. 200-800ms API calls
- Data can be up to TTL-minutes stale (mitigated by force-refresh option)
- Need to handle cache invalidation on writes (e.g., after sending an email, invalidate Gmail cache)

**Estimated effort**: 1-2 days. One shared utility function (`getCachedOrFetch`) + modify each route to use it.

**Cost**: $0 incremental (Supabase free tier has plenty of headroom for cache reads).

---

### Option 2: Reuse LiveKit Rooms (Session Persistence)

**What**: Instead of creating a new room every mic-button press, keep the room alive for the duration of the user's browser session. Reconnect to the same room if the user toggles the mic off and back on.

**How it works**:
- Store `roomName` and `participantToken` in React state (or sessionStorage)
- On "disconnect", just mute the mic / pause the audio track instead of destroying the room
- Only create a new room if the token is expired (15-min TTL) or the session is truly new
- Bump token TTL from 15 minutes to 1 hour

**Pros**:
- Room join goes from ~2-3 seconds to near-instant (reconnect vs. cold start)
- Agent doesn't need to re-initialize Gemini Realtime and Silero VAD each time
- Fewer LiveKit room-create operations (matters for billing at scale)
- Better UX: feels like a walkie-talkie toggle, not a new call each time

**Cons**:
- Need to handle edge cases: token expiry, agent crash, network drop
- Gemini Realtime session may have a max duration (need to verify)
- Slightly more complex frontend state management

**Estimated effort**: Half a day. Mostly frontend changes in `VoiceAgent.tsx`.

**Cost**: Reduces LiveKit billing (fewer room-minutes wasted on setup/teardown).

---

### Option 3: Parallel Tool Execution in the Agent

**What**: Currently, when the user asks "give me my morning update", Gemini calls tools sequentially (GitHub → Gmail → Calendar). Restructure so the agent can kick off all three data fetches in parallel.

**Two approaches**:

**A) Pre-fetch on room join (recommended)**:
When a user joins a LiveKit room, immediately fire off parallel fetches for GitHub, Gmail, and Calendar in the background. Store results in a Python dict. When the user asks a question, the data is already there.

```python
# On participant connect:
async def prefetch_user_data(user_id):
    github, gmail, calendar = await asyncio.gather(
        fetch_github(user_id),
        fetch_gmail(user_id),
        fetch_calendar(user_id),
    )
    USER_CONTEXT[user_id] = { "github": github, "gmail": gmail, "calendar": calendar }
```

**B) Parallel tool calls via Gemini**:
Gemini 2.5 Flash supports parallel function calling natively. The current tool definitions already support this — the issue is that Gemini typically calls them one-by-one because the system prompt doesn't encourage batching. Adding a prompt hint like "When the user asks for a general update, call get_github_activity, get_unread_emails, and get_calendar_events simultaneously" can help.

**Pros**:
- Pre-fetch: First response is near-instant (data already loaded)
- Parallel tools: 3 sequential 1-2s calls become 1 parallel 1-2s call
- Combined with Option 1 (cache), pre-fetched data can come from cache = ~50ms total

**Cons**:
- Pre-fetch wastes API calls if user only asks about one source
- Pre-fetch with Option 1 cache = negligible waste (just cache reads)
- Gemini parallel tool calling is not guaranteed (model decides)

**Estimated effort**: Half a day for pre-fetch. Prompt change for parallel tools is 15 minutes.

**Cost**: If pre-fetching from cache (Option 1), effectively free. Without cache, adds 20 API calls per room join that may not be needed.

---

### Option 4: Scheduled Background Sync (Cron Job)

**What**: Run a cron job (Supabase Edge Function, Vercel Cron, or a simple GitHub Action) that fetches and caches each user's data on a schedule — e.g., every morning at 7 AM local time.

**How it works**:
```
Cron (7 AM) → For each active user:
  → Fetch GitHub repos, recent commits/PRs
  → Fetch Gmail inbox (last 24h)
  → Fetch Calendar (next 7 days)
  → Store in Supabase cache table
  → Optionally: pre-generate briefing
```

**Pros**:
- Dashboard loads instantly (all data pre-cached)
- Briefing is ready before the user even opens the app
- Zero API calls at request time for read-only data
- External API rate limits become irrelevant (spread load over off-peak hours)

**Cons**:
- Need to know each user's timezone for "morning" timing
- Data can be hours stale by afternoon (need on-demand refresh as fallback)
- Requires a cron infrastructure (Vercel Cron is free for hobby, $0 on free tier)
- Fetches data for inactive users (waste) — mitigate by only syncing users active in last 7 days
- OAuth tokens may expire between syncs (need refresh logic in the cron)

**Estimated effort**: 1-2 days. Depends on cron infrastructure choice.

**Cost**:
- Vercel Cron: Free (hobby plan, 1 cron job)
- Supabase Edge Function: Free tier includes 500K invocations/month
- GitHub Actions: Free for public repos, 2000 min/month for private

**Recommendation**: Start with Option 1 (on-demand cache) first. Add cron later only if you need sub-100ms dashboard loads or want pre-generated briefings.

---

### Option 5: Fix the Gmail N+1 Problem

**What**: The Gmail route currently lists message IDs then fetches each individually. Use Gmail's `batchGet` or `list` with `format=metadata` to reduce calls.

**Current flow** (11 API calls for 10 emails):
```
1. GET /messages?maxResults=20          → returns 20 message IDs
2. GET /messages/{id1}?format=metadata  → message 1
3. GET /messages/{id2}?format=metadata  → message 2
... (×10)
```

**Optimized flow** (2 API calls):
```
1. GET /messages?maxResults=10          → returns 10 message IDs
2. POST /batch (multipart)              → all 10 messages in one request
```

Or even simpler — Gmail's `list` endpoint already returns `snippet` for each message. For the voice agent, snippets are often sufficient. Skip the individual fetches entirely for the agent use case.

**Pros**:
- Cuts Gmail API calls from 11 to 1-2
- Significantly faster response time
- Reduces risk of hitting Gmail API rate limits

**Cons**:
- Batch API is slightly more complex to implement
- Snippet-only approach loses email body (but agent rarely needs full body)

**Estimated effort**: 2-4 hours.

**Cost**: $0.

---

### Option 6: Reduce Token Usage in LLM Prompts

**Current token spend per interaction**:

| Component | Estimated Tokens | Notes |
|-----------|-----------------|-------|
| `AGENT_INSTRUCTION` (system prompt) | ~500 | Loaded once per session |
| GitHub tool result (5 commits, 3 PRs) | ~300-800 | Per tool call |
| Gmail tool result (5 emails) | ~400-1000 | Per tool call |
| Calendar tool result (5 events) | ~200-400 | Per tool call |
| Briefing evidence pack (pre-compression) | ~2000-4000 | Per briefing |
| Briefing evidence pack (post-compression) | ~600-1200 | After Bear-1 |
| Briefing prompt + schema | ~800 | Per briefing |

**Quick wins**:

1. **Trim tool results more aggressively before returning to Gemini**:
   - GitHub: Return only commit message first line + author. Skip file lists and patches in tool results (only include in briefing).
   - Gmail: Return sender name + subject only. Skip snippets for voice (Otto reads them aloud anyway).
   - Calendar: Return title + time only. Skip descriptions and locations unless asked.

2. **Move the briefing JSON schema out of the prompt**: Use Gemini's `responseSchema` parameter (structured output) instead of describing the schema in text. This alone saves ~300 tokens per briefing.

3. **Compress the item index in briefing**: Currently the uncompressed item index is sent alongside the compressed evidence. Compress both, or make the index more concise (just IDs and titles, no types).

4. **Use session context in Gemini Realtime**: Since Gemini Realtime maintains conversation history, previously fetched data doesn't need to be re-sent. If the user already asked about GitHub, a follow-up question can reference the prior turn instead of re-fetching.

**Pros**:
- Reduces Gemini API cost per interaction
- Faster responses (fewer tokens to generate)
- TTC compression costs decrease (less input)

**Cons**:
- More aggressive trimming may occasionally drop relevant detail
- Structured output support depends on Gemini model version

**Estimated effort**: 2-4 hours for trimming. 1 hour for schema change.

**Cost**: Saves money on Gemini API and TTC API.

---

### Option 7: Eliminate the Internal HTTP Hop for Agent Tools

**What**: The Python agent currently calls `localhost:3000/api/gmail` which then calls `googleapis.com`. Cut out the middleman — have the Python agent call external APIs directly.

**Two approaches**:

**A) Direct API calls from Python (bigger change)**:
Move the token-fetching logic into Python. Agent reads tokens from Supabase directly and calls GitHub/Gmail/Calendar APIs without going through Next.js.

**B) Shared cache (simpler, pairs with Option 1)**:
Agent reads from the same Supabase cache table that the Next.js routes populate. No external API calls from the agent at all — just database reads.

**Recommendation**: Go with B. If you implement Option 1 (server-side cache), the agent tools become simple Supabase queries instead of HTTP chains.

**Pros**:
- Eliminates double-hop latency (agent → Next.js → external API)
- Agent tools respond in ~50ms instead of 1-3 seconds
- Fewer failure points

**Cons**:
- Approach A requires duplicating auth/token refresh logic in Python
- Approach B requires Option 1 to be implemented first
- Approach B means agent data is as fresh as the cache (not real-time)

**Estimated effort**: Approach B is 2-3 hours (after Option 1 is done).

**Cost**: $0.

---

## Implementation Priority Matrix

| Priority | Option | Impact | Effort | Cost |
|----------|--------|--------|--------|------|
| **1** | **Option 1: Server-side cache** | Eliminates 80% of API calls | 1-2 days | $0 |
| **2** | **Option 2: Reuse LiveKit rooms** | Instant reconnect, better UX | 0.5 day | Saves $ |
| **3** | **Option 5: Fix Gmail N+1** | 11 calls → 1-2 calls | 2-4 hours | $0 |
| **4** | **Option 3: Parallel pre-fetch** | First answer is instant | 0.5 day | $0 |
| **5** | **Option 6: Trim token usage** | Lower cost, faster responses | 2-4 hours | Saves $ |
| **6** | **Option 7B: Agent reads from cache** | Eliminates double-hop | 2-3 hours | $0 |
| **7** | **Option 4: Cron background sync** | Zero-latency dashboard | 1-2 days | $0-5/mo |

**Recommended order**: 1 → 2 → 5 → 3 → 6 → 7 → 4

Do Options 1 + 2 + 5 first. That alone takes ~2-3 days of work and eliminates 90%+ of redundant API calls, makes LiveKit sessions feel instant, and fixes the worst N+1 pattern. Options 3, 6, and 7 are natural follow-ups that compound on Option 1. Option 4 (cron) is a nice-to-have for when you want the dashboard to feel like it loads in 0ms.

---

## Before vs. After (Projected)

| Metric | Current | After Options 1+2+5 | After All |
|--------|---------|---------------------|-----------|
| API calls per session | ~48 | ~5-8 (cache misses only) | ~2-3 |
| Dashboard load time | 3-5s | 0.5-1s (cache hit) | <200ms (pre-synced) |
| LiveKit connect time | 2-3s | <500ms (reconnect) | <500ms |
| Gmail fetch calls | 11 | 1-2 | 1 (from cache) |
| Agent tool latency | 1-3s per tool | 200-500ms (cached) | ~50ms (direct cache read) |
| Gemini tokens per briefing | ~3500 | ~3500 | ~2000 (trimmed) |
| Monthly external API calls (10 users) | ~15,000+ | ~2,000 | ~500 |

---

## Risks and Tradeoffs

1. **Staleness vs. Speed**: Caching means data can be minutes old. For email this matters more than for GitHub. Mitigation: keep email TTL short (5 min) and always allow force-refresh.

2. **Cache invalidation on writes**: After sending an email or creating a calendar event, the cache for that data type must be invalidated. Otherwise the UI shows stale data. This is straightforward but must not be forgotten.

3. **Memory vs. Database cache**: Current in-memory caches (briefing, TTC) are lost on server restart and not shared across serverless instances. Moving to Supabase fixes both issues but adds a database dependency. For a Next.js app on Vercel, this is the right call since serverless functions don't share memory.

4. **LiveKit room reuse**: Long-lived rooms may accumulate state. Need to handle agent reconnection gracefully if the agent process restarts while the room is still alive.

5. **Pre-fetching waste**: Fetching all 3 data sources on room join wastes calls if the user only asks about one. With caching in place, this waste is negligible (just cache reads). Without caching, don't pre-fetch.
