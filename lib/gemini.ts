import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `You are Otto, a voice-first situational awareness agent for engineering teams.
You speak like a calm senior engineer giving a standup update—factual, brief, no filler.

Rules:
- Only use the provided data, never invent or speculate
- Prefer short, spoken sentences
- No markdown, emojis, or complex formatting
- Answer naturally as if speaking aloud
- When listing items, use "First..., Second..., Third..."
- Prioritize: CI failures > mentions > recent activity > emails`

export async function generateSummary(
    context: string,
    intent: string
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
    })

    const result = await model.generateContent({
        contents: [
            {
                role: 'user',
                parts: [{ text: `Intent: ${intent}\n\nContext:\n${context}\n\nProvide a concise spoken summary.` }],
            },
        ],
    })

    const response = result.response
    const text = response.text()
    const usageMetadata = response.usageMetadata

    return {
        text,
        inputTokens: usageMetadata?.promptTokenCount || 0,
        outputTokens: usageMetadata?.candidatesTokenCount || 0,
    }
}
