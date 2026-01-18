import pLimit from 'p-limit';

const TTC_API_URL = 'https://api.thetokencompany.com/v1/compress';
const TIMEOUT_MS = parseInt(process.env.TTC_TIMEOUT_MS || '4000', 10);
const MAX_CONCURRENCY = parseInt(process.env.TTC_MAX_CONCURRENCY || '3', 10);
const DEFAULT_AGGRESSIVENESS = parseFloat(process.env.TTC_AGGRESSIVENESS || '0.5');

// In-memory cache: Map<hash, { output, metrics, timestamp }>
const cache = new Map<string, { output: string; metrics: any; timestamp: number }>();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Concurrency limiter
const limit = pLimit(MAX_CONCURRENCY);

interface CompressionResult {
    output: string;
    output_tokens: number; // Corrected from output_token_count
    original_input_tokens: number; // Corrected from input_token_count
    compression_time: number;
    cached?: boolean;
    fallback?: boolean;
}

async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function compressWithBear(
    input: string,
    aggressiveness: number = DEFAULT_AGGRESSIVENESS
): Promise<CompressionResult> {
    // 1. Check Cache
    const cacheKey = await sha256(`${input}:${aggressiveness}`);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log('[TokenCompany] Cache hit');
        return { ...cached.metrics, output: cached.output, cached: true };
    }

    // 2. Execute with Concurrency Limit & Retry
    return limit(async () => {
        try {
            console.log(`[TokenCompany] Compressing ${input.length} chars...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const response = await fetch(TTC_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.TTC_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'bear-1',
                    compression_settings: {
                        aggressiveness,
                        max_output_tokens: null,
                        min_output_tokens: null
                    },
                    input
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`TTC API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            const result: CompressionResult = {
                output: data.output,
                output_tokens: data.output_tokens,
                original_input_tokens: data.original_input_tokens,
                compression_time: data.compression_time,
                cached: false
            };

            // Update Cache
            cache.set(cacheKey, { output: result.output, metrics: result, timestamp: Date.now() });

            return result;

        } catch (error) {
            console.error('[TokenCompany] Compression failed, falling back to original text:', error);

            // Fallback: Return original text (simulate "compression" that did nothing)
            // We estimate tokens as chars / 4 roughly for the fallback metrics
            const estimatedTokens = Math.ceil(input.length / 4);
            return {
                output: input,
                output_tokens: estimatedTokens,
                original_input_tokens: estimatedTokens,
                compression_time: 0,
                fallback: true
            };
        }
    });
}
