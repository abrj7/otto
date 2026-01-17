/**
 * Intent Detection for Otto queries
 */

export type Intent =
    | { type: 'person_branch'; person: string; branch: string }
    | { type: 'standup'; hours: number }
    | { type: 'changes_since'; timeframe: string }
    | { type: 'daily_briefing' }
    | { type: 'follow_up'; topic: string }
    | { type: 'unknown'; raw: string }

const PERSON_BRANCH_PATTERN = /summarize\s+(\w+)(?:'s)?\s+work\s+on\s+(.+)/i
const STANDUP_PATTERN = /standup\s+(?:for\s+)?(?:last\s+)?(\d+)\s*hours?/i
const CHANGES_SINCE_PATTERN = /what\s+changed\s+since\s+(.+)/i
const DAILY_BRIEFING_PATTERNS = [
    /what\s+do\s+i\s+need\s+to\s+care\s+about/i,
    /what's\s+happening/i,
    /daily\s+briefing/i,
    /what\s+do\s+i\s+need\s+to\s+know/i,
]

export function detectIntent(query: string): Intent {
    // Person + Branch summary
    const personBranchMatch = query.match(PERSON_BRANCH_PATTERN)
    if (personBranchMatch) {
        return {
            type: 'person_branch',
            person: personBranchMatch[1],
            branch: personBranchMatch[2].trim(),
        }
    }

    // Standup for N hours
    const standupMatch = query.match(STANDUP_PATTERN)
    if (standupMatch) {
        return {
            type: 'standup',
            hours: parseInt(standupMatch[1], 10),
        }
    }

    // Changes since...
    const changesSinceMatch = query.match(CHANGES_SINCE_PATTERN)
    if (changesSinceMatch) {
        return {
            type: 'changes_since',
            timeframe: changesSinceMatch[1].trim(),
        }
    }

    // Daily briefing
    for (const pattern of DAILY_BRIEFING_PATTERNS) {
        if (pattern.test(query)) {
            return { type: 'daily_briefing' }
        }
    }

    // Unknown - treat as follow-up or general query
    return { type: 'unknown', raw: query }
}

export function intentToPrompt(intent: Intent): string {
    switch (intent.type) {
        case 'person_branch':
            return `Summarize ${intent.person}'s work on the ${intent.branch} branch`
        case 'standup':
            return `Provide a standup summary for the last ${intent.hours} hours`
        case 'changes_since':
            return `Summarize what changed since ${intent.timeframe}`
        case 'daily_briefing':
            return 'Provide a daily briefing of what needs attention'
        case 'follow_up':
            return `Provide more details about: ${intent.topic}`
        case 'unknown':
            return intent.raw
    }
}
