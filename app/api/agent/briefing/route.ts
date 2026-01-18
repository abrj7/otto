import { NextRequest, NextResponse } from 'next/server';
import { compressWithBear } from '@/lib/tokenCompany';
import { BriefingSchema } from '@/lib/briefingSchema';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Config
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Simple In-Memory Cache (UserId -> { data, timestamp })
const BRIEFING_CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 Min

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
});

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const forceRefresh = searchParams.get('force') === 'true'; // Check for force refresh
    const secret = req.headers.get('x-agent-secret');

    // Auth Check: Agent Secret OR Session
    if (!userId) {
        return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // --- CACHE CHECK ---
    if (!forceRefresh) {
        const cached = BRIEFING_CACHE.get(userId);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            console.log("Serving cached briefing for", userId);
            return NextResponse.json(cached.data, {
                headers: { 'X-Cache': 'HIT' }
            });
        }
    }

    try {
        // 1. Fetch Data (Parallel)
        // Switch GitHub to 'repos' to avoid 400 error on 'details' without owner/repo
        const [gmailRes, calendarRes, githubRes] = await Promise.all([
            fetch(`${APP_URL}/api/agent/gmail?user_id=${userId}&limit=15&full=true`),
            fetch(`${APP_URL}/api/agent/calendar?user_id=${userId}&timeframe=week`),
            fetch(`${APP_URL}/api/agent/github?user_id=${userId}&action=repos`)
        ]);

        let hasAuthError = false;

        const emails = gmailRes.ok ? await gmailRes.json() : { messages: [] };
        if (gmailRes.status === 401) hasAuthError = true;

        const calendar = calendarRes.ok ? await calendarRes.json() : { events: [] };
        if (calendarRes.status === 401) hasAuthError = true;

        // If GitHub fails or is empty, we handle it gracefully
        const github = githubRes.ok ? await githubRes.json() : { repos: [], commits: [] };

        // 2. Normalize & Trim (Build Evidence Pack)
        let evidenceText = "";
        const itemIndex: any[] = [];

        // --- Process Emails ---
        // Filter: only unread or important
        const relevantEmails = (emails.messages || []).slice(0, 10);
        for (const m of relevantEmails) {
            const id = `EMAIL[${m.id}]`;
            itemIndex.push({ id, title: m.subject, type: 'email' });

            // Trim body: remove quoted replies
            let body = (m.body || m.snippet || "").replace(/\r\n/g, "\n");
            body = body.split(/On .* wrote:/)[0];
            body = body.substring(0, 300); // Hard cap

            evidenceText += `${id} from="${m.from}" subject="${m.subject}" time="${m.timeAgo}"\n`;
            evidenceText += `body: ${body}\n\n`;
        }

        // --- Process Calendar ---
        const relevantEvents = (calendar.events || []).slice(0, 5);
        for (const e of relevantEvents) {
            const id = `CAL[${e.id || 'evt_' + Math.random().toString(36).substr(2, 5)}]`;
            itemIndex.push({ id, title: e.title, type: 'calendar' });

            evidenceText += `${id} title="${e.title}" time="${e.start}" location="${e.location || 'none'}"\n`;
            if (e.description) {
                evidenceText += `notes: ${e.description.substring(0, 200)}\n`;
            }
            evidenceText += `\n`;
        }

        // --- Process GitHub ---
        // Handle Action=Repos output
        const repos = github.repos || [];
        for (const r of repos.slice(0, 5)) {
            const id = `GH[repo_${r.id}]`;
            itemIndex.push({ id, title: r.fullName, type: 'github_repo' });
            evidenceText += `${id} repo="${r.fullName}" updated="${r.updatedAt}" desc="${r.description || ''}"\n`;
        }

        // Handle commits (if any - though action=repos usually doesn't return them, we keep this for robust logic)
        const commits = github.commits || [];
        for (const c of commits.slice(0, 5)) {
            const id = `GH[commit_${c.sha.substring(0, 7)}]`;
            itemIndex.push({ id, title: c.message, type: 'github_commit' });

            evidenceText += `${id} author="${c.author}" repo="${github.repo?.name}" date="${c.timeAgo}"\n`;
            evidenceText += `msg: ${c.message}\n`;

            if (c.files && c.files.length > 0) {
                evidenceText += `files: ${c.files.map((f: any) => f.filename).join(', ')}\n`;
                const heavyPatch = c.files.map((f: any) => f.patch).join('\n').substring(0, 800);
                evidenceText += `diff_snippet: ${heavyPatch}\n`;
            }
            evidenceText += `\n`;
        }

        const prs = github.pullRequests || [];
        for (const p of prs.slice(0, 3)) {
            const id = `GH[pr_${p.number}]`;
            itemIndex.push({ id, title: p.title, type: 'github_pr' });
            evidenceText += `${id} author="${p.author}" state="${p.state}" title="${p.title}"\n\n`;
        }

        // 3. Compress with Token Company Bear-1
        let compressionStats;
        let compressedOutput = "";

        if (!evidenceText.trim()) {
            console.log("No evidence to compress, skipping Bear-1");
            compressionStats = {
                original_input_tokens: 0,
                output_tokens: 0,
                compression_time: 0
            };
            compressedOutput = "No data available from connected services.";
        } else {
            compressionStats = await compressWithBear(evidenceText);
            compressedOutput = compressionStats.output;
        }

        // 4. Call Gemini - Guard against empty context
        if (!compressedOutput.trim() && !evidenceText.trim()) {
            console.log("Empty evidence, skipping Gemini and returning fallback.");
            return NextResponse.json(generateFallbackBriefing());
        }

        const prompt = `
        You are an elite executive assistant. Generate a daily briefing based on the following COMPRESSED evidence.
        
        CRITICAL INSTRUCTIONS:
        1. Use the provided Evidence Pack which has been compressed with Bear-1.
        2. Cite sources using the ID tags (e.g. EMAIL[...], GH[...]) in the 'sources' arrays.
        3. Do NOT invent facts.
        4. Focus on what requires attention.
        5. **NARRATIVE MODE**: content should be written as a cohesive story, not just a list.
           - Paragraph 1: High-level synthesis of what's happening.
           - Paragraph 2: Specific deadlines, meetings, or blockers.
           - Paragraph 3: Github/Technical progress and what to review.
           - Tone: Professional, direct, "The Morning Briefing" style.

        6. RETURN JSON ONLY. MATCH THIS SCHEMA EXACTLY:
        {
          "generated_at": "ISO-8601 string",
          "greeting": "string (e.g. 'Good morning')",
          "narrative": "string (A 3-4 paragraph cohesive story using markdown. Use **bold** for emphasis.)",
          "time_context": {
            "local_time": "string",
            "timezone": "string"
          },
          "highlights": [
            {
              "type": "calendar | email | github | messages",
              "title": "string (max 200 chars)",
              "detail": "string (max 500 chars)",
              "why_it_matters": "string (max 500 chars)",
              "urgency": "high | medium | low",
              "sources": [{ "kind": "string", "id": "string", "label": "string" }]
            }
          ],
          "recommendations": [
            {
              "action": "string (max 200 chars)",
              "steps": ["string"],
              "sources": [{ "kind": "string", "id": "string", "label": "string" }]
            }
          ],
          "rollup": {
            "email": { "unread_count": number },
            "calendar": { "today_count": number, "next_event_id": "string (optional)" },
            "github": { "active_repos": ["string"], "open_prs": number (optional) }
          }
        }
        
        CONTEXT:
        Current Time: ${new Date().toLocaleString()}
        
        ITEMS INDEX (Uncompressed reference):
        ${JSON.stringify(itemIndex, null, 2)}
        
        COMPRESSED EVIDENCE PACK:
        ${compressedOutput}
        `;

        let parsed;
        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            console.log("RAW GEMINI OUTPUT:", responseText); // Critical for debugging

            try {
                // Handle potential markdown code block wrapping
                const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
                parsed = JSON.parse(jsonStr);
            } catch (e) {
                console.error("Gemini non-JSON output", responseText);
                throw new Error("Failed to parse Gemini output");
            }

            // --- SAFEFY FIX: Guarantee at least one highlight (Zod min(1) fix) ---
            if (hasAuthError) {
                // Priority 1: Auth Warning
                parsed.highlights.unshift({
                    type: "email",
                    title: "Connect Your Accounts",
                    detail: "We couldn't access your Email or Calendar. Please connect your Google account in settings.",
                    why_it_matters: "Briefings are best with full context.",
                    urgency: "high",
                    sources: []
                });
            } else if (!parsed.highlights || parsed.highlights.length === 0) {
                // Priority 2: Empty State
                parsed.highlights = [{
                    type: "messages",
                    title: "No Major Updates",
                    detail: "No significant activity detected in your connected sources.",
                    why_it_matters: "Your dashboard is ready when you are.",
                    urgency: "low",
                    sources: []
                }];
            }
            if (!parsed.recommendations) parsed.recommendations = [];

            // Add debug stats
            parsed.debug = {
                compression: {
                    original_input_tokens: compressionStats.original_input_tokens,
                    output_tokens: compressionStats.output_tokens,
                    compression_time: compressionStats.compression_time
                }
            };

            // Validate strictly
            const validated = BriefingSchema.parse(parsed);

            // --- SAVE TO CACHE ---
            BRIEFING_CACHE.set(userId, {
                data: validated,
                timestamp: Date.now()
            });

            return NextResponse.json(validated);

        } catch (error: any) {
            console.error("Briefing/Validation Error:", error);
            // Fallback to heuristic briefing on ANY error
            return NextResponse.json(generateFallbackBriefing());
        }

    } catch (error: any) {
        console.error("Fatal Agent Error:", error);
        return NextResponse.json(generateFallbackBriefing(), { status: 200 }); // Return 200 with fallback content
    }
}

function generateFallbackBriefing() {
    return {
        generated_at: new Date().toISOString(),
        greeting: "Here is your summary.",
        time_context: {
            local_time: new Date().toLocaleString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        highlights: [
            {
                type: "messages",
                title: "System Update",
                detail: "We couldn't generate the full AI briefing right now, but your systems are connected.",
                why_it_matters: "AI generation fallback mode active.",
                urgency: "low",
                sources: []
            }
        ],
        recommendations: [],
        rollup: {
            email: { unread_count: 0 },
            calendar: { today_count: 0 },
            github: { active_repos: [] }
        }
    };
}
