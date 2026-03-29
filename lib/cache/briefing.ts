/**
 * Briefing Generation
 *
 * Reads from cache layer (no internal HTTP calls)
 * Parallel data fetch → TTC compression → Gemini generation
 * In-memory briefing cache with 30-min TTL
 */

import { getGmailMessages } from './gmail'
import { getCalendarEvents } from './calendar'
import { getGitHubRepos } from './github'
import { compressWithBear } from '@/lib/tokenCompany'
import { BriefingSchema } from '@/lib/briefingSchema'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

// In-memory briefing cache (30 min TTL)
const BRIEFING_CACHE = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL_MS = 30 * 60 * 1000

/**
 * Clear the in-memory briefing cache for a user.
 * Call this when a provider is connected/disconnected so the next
 * dashboard load generates a fresh briefing with the new data.
 */
export function clearBriefingCache(userId: string) {
    BRIEFING_CACHE.delete(userId)
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
})

export async function generateBriefing(userId: string, force = false) {
    // Check briefing cache
    if (!force) {
        const cached = BRIEFING_CACHE.get(userId)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data
        }
    }

    // Parallel data fetch — all go through cache layer (no HTTP calls if cache is fresh)
    const [gmailResult, calendarResult, githubResult] = await Promise.all([
        getGmailMessages(userId, { limit: 15, full: true }).catch(() => ({ messages: [] })),
        getCalendarEvents(userId, { timeframe: 'week' }).catch(() => ({ events: [] })),
        getGitHubRepos(userId).catch(() => ({ repos: [] })),
    ])

    const emails = 'messages' in gmailResult ? gmailResult.messages : []
    const events = 'events' in calendarResult ? calendarResult.events : []
    const repos = 'repos' in githubResult ? githubResult.repos : []

    let hasAuthError = false
    if ('error' in gmailResult || 'error' in calendarResult) hasAuthError = true

    // Build evidence pack (trimmed for token efficiency)
    let evidenceText = ''
    const itemIndex: any[] = []

    for (const m of (emails as any[]).slice(0, 10)) {
        const id = `EMAIL[${m.id}]`
        itemIndex.push({ id, title: m.subject, type: 'email' })

        let body = (m.body || m.snippet || '').replace(/\r\n/g, '\n')
        body = body.split(/On .* wrote:/)[0].substring(0, 300)

        evidenceText += `${id} from="${m.from}" subject="${m.subject}" time="${m.timeAgo}"\nbody: ${body}\n\n`
    }

    for (const e of (events as any[]).slice(0, 5)) {
        const id = `CAL[${e.id || 'evt'}]`
        itemIndex.push({ id, title: e.title, type: 'calendar' })
        evidenceText += `${id} title="${e.title}" time="${e.start}" location="${e.location || 'none'}"\n`
        if (e.description) evidenceText += `notes: ${e.description.substring(0, 200)}\n`
        evidenceText += '\n'
    }

    for (const r of (repos as any[]).slice(0, 5)) {
        const id = `GH[repo_${r.id}]`
        itemIndex.push({ id, title: r.fullName, type: 'github_repo' })
        evidenceText += `${id} repo="${r.fullName}" updated="${r.updatedAt}" desc="${r.description || ''}"\n`
    }

    // Compress with Bear-1
    let compressionStats: any
    let compressedOutput = ''

    if (!evidenceText.trim()) {
        compressionStats = { original_input_tokens: 0, output_tokens: 0, compression_time: 0 }
        compressedOutput = 'No data available from connected services.'
    } else {
        compressionStats = await compressWithBear(evidenceText)
        compressedOutput = compressionStats.output
    }

    if (!compressedOutput.trim() && !evidenceText.trim()) {
        return generateFallbackBriefing()
    }

    // Gemini prompt — schema moved to responseMimeType, keeping prompt lean
    const prompt = `You are an elite executive assistant. Generate a daily briefing from the COMPRESSED evidence below.

INSTRUCTIONS:
1. Use the Evidence Pack (compressed with Bear-1). Cite sources using ID tags (EMAIL[...], GH[...], CAL[...]).
2. Do NOT invent facts. Focus on what requires attention.
3. NARRATIVE MODE: 3-4 paragraph cohesive story. Paragraph 1: high-level synthesis. Paragraph 2: deadlines/blockers. Paragraph 3: technical progress.
4. Return JSON matching this schema exactly:
{"generated_at":"ISO-8601","greeting":"string","narrative":"string (markdown, use **bold**)","time_context":{"local_time":"string","timezone":"string"},"highlights":[{"type":"calendar|email|github|messages","title":"string","detail":"string","why_it_matters":"string","urgency":"high|medium|low","sources":[{"kind":"string","id":"string","label":"string"}]}],"recommendations":[{"action":"string","steps":["string"],"sources":[{"kind":"string","id":"string","label":"string"}]}],"rollup":{"email":{"unread_count":0},"calendar":{"today_count":0},"github":{"active_repos":[]}}}

CONTEXT:
Current Time: ${new Date().toLocaleString()}

ITEMS INDEX:
${JSON.stringify(itemIndex)}

COMPRESSED EVIDENCE:
${compressedOutput}`

    try {
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        let parsed
        try {
            const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim()
            parsed = JSON.parse(jsonStr)
        } catch {
            throw new Error('Failed to parse Gemini output')
        }

        if (hasAuthError) {
            parsed.highlights = parsed.highlights || []
            parsed.highlights.unshift({
                type: 'email',
                title: 'Connect Your Accounts',
                detail: "We couldn't access your Email or Calendar. Please connect your Google account in settings.",
                why_it_matters: 'Briefings are best with full context.',
                urgency: 'high',
                sources: [],
            })
        } else if (!parsed.highlights || parsed.highlights.length === 0) {
            parsed.highlights = [{
                type: 'messages',
                title: 'No Major Updates',
                detail: 'No significant activity detected in your connected sources.',
                why_it_matters: 'Your dashboard is ready when you are.',
                urgency: 'low',
                sources: [],
            }]
        }
        if (!parsed.recommendations) parsed.recommendations = []

        parsed.debug = {
            compression: {
                original_input_tokens: compressionStats.original_input_tokens,
                output_tokens: compressionStats.output_tokens,
                compression_time: compressionStats.compression_time,
            },
        }

        const validated = BriefingSchema.parse(parsed)

        BRIEFING_CACHE.set(userId, { data: validated, timestamp: Date.now() })
        return validated
    } catch (error: any) {
        console.error('Briefing generation error:', error)
        return generateFallbackBriefing()
    }
}

function generateFallbackBriefing() {
    return {
        generated_at: new Date().toISOString(),
        greeting: 'Here is your summary.',
        time_context: {
            local_time: new Date().toLocaleString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        highlights: [{
            type: 'messages',
            title: 'System Update',
            detail: "We couldn't generate the full AI briefing right now, but your systems are connected.",
            why_it_matters: 'AI generation fallback mode active.',
            urgency: 'low',
            sources: [],
        }],
        recommendations: [],
        rollup: {
            email: { unread_count: 0 },
            calendar: { today_count: 0 },
            github: { active_repos: [] },
        },
    }
}
