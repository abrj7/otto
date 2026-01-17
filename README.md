# OTTO 🎤

> Voice-first situational awareness agent for engineering teams

Otto is not a chatbot or dashboard. It's your senior engineer teammate who already read all the PRs, Slack threads, and emails—and gives you the 60-second version out loud.

## Features

- **Voice-first interface** powered by LiveKit
- **7 integrations**: GitHub, Slack, Teams, Notion, Gmail, Calendar, Linear
- **Smart briefings**: "What do I need to care about today?"
- **Natural follow-ups**: "Tell me more about Aidan's branch"

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind, shadcn/ui |
| Backend | Next.js API Routes, Supabase |
| Voice | LiveKit Agents SDK (Python) |
| LLM | Gemini 2.5 Flash (Google) |

## Quick Start

### 1. Install dependencies

```bash
# Frontend
npm install

# Agent (Python)
cd agent && pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in your API keys
```

### 3. Run development servers

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: LiveKit Agent
cd agent && python main.py dev
```

### 4. Open browser

```
http://localhost:3000
```

## Query Examples

| Query | What Otto Does |
|-------|---------------|
| "What do I need to care about today?" | Daily briefing across all sources |
| "Summarize Aidan's work on auth-refactor" | Person + branch summary |
| "What changed since yesterday?" | Recent activity summary |
| "Standup for last 3 hours" | Time-based activity |

## Project Structure

```
otto/
├── app/                    # Next.js pages and API routes
│   ├── (dashboard)/       # Main dashboard
│   ├── onboarding/        # Account connection
│   └── api/               # Backend routes
├── components/            # React components
│   ├── blocks/           # Response blocks
│   └── voice/            # Voice components
├── lib/                   # Core logic
│   ├── integrations/     # API clients
│   └── query/            # Query engine
└── agent/                 # LiveKit Python agent
```

## Environment Variables

See `.env.example` for all required variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `LIVEKIT_*` - LiveKit Cloud credentials
- `GEMINI_API_KEY` - Google Gemini API key
- `GITHUB_TOKEN` - GitHub PAT
- And more for each integration...

## Team Work Streams

| Stream | Focus |
|--------|-------|
| 1. Backend | Query engine, Claude, API routes |
| 2. Integrations | GitHub, Slack, Teams, Notion, Gmail, Calendar, Linear |
| 3. Frontend | Dashboard, Onboarding, Components |
| 4. Voice | LiveKit agent, MicButton, voice flow |

## License

MIT
