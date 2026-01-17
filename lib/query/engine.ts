/**
 * Query Engine
 * Main entry point for processing user queries
 */

import type { QueryResponse, Receipt } from '@/types'
import { detectIntent, intentToPrompt } from './intents'
import { aggregateContext } from './aggregator'
import { compressContext } from '@/lib/compression'
import { generateSummary } from '@/lib/gemini'

export async function processQuery(
    query: string,
    workspaceId: string
): Promise<QueryResponse> {
    // 1. Detect intent
    const intent = detectIntent(query)
    const intentPrompt = intentToPrompt(intent)

    // 2. Fetch relevant data
    const { events, textContext, sources } = await aggregateContext(intent, workspaceId)

    // 3. Compress context (stub for now)
    const { compressed, originalTokens } = await compressContext(textContext)

    // 4. Generate summary via Claude
    const { text: summary, inputTokens, outputTokens } = await generateSummary(
        compressed,
        intentPrompt
    )

    // 5. Extract receipts
    const receipts = extractReceipts(events)

    return {
        summary,
        receipts,
        token_stats: {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            compression_ratio: originalTokens > 0 ? originalTokens / inputTokens : null,
        },
    }
}

function extractReceipts(events: Event[]): Receipt[] {
    return events
        .filter((event) => event.url)
        .slice(0, 10) // Limit to 10 receipts
        .map((event) => ({
            type: mapEventToReceiptType(event.integration_type, event.event_type),
            title: event.title || event.event_type,
            url: event.url!,
        }))
}

function mapEventToReceiptType(
    integration: string,
    eventType: string
): Receipt['type'] {
    if (integration === 'github') {
        if (eventType === 'push' || eventType === 'commit') return 'commit'
        if (eventType === 'pull_request') return 'pr'
    }
    if (integration === 'slack' || integration === 'teams') return 'slack'
    if (integration === 'gmail') return 'email'
    if (integration === 'calendar') return 'event'
    if (integration === 'linear') return 'issue'
    return 'commit' // fallback
}

// Re-export Event for the function
import type { Event } from '@/types'
