import { z } from 'zod';

export const BriefingSchema = z.object({
    generated_at: z.string().describe("ISO timestamp of generation"),
    greeting: z.string(),
    narrative: z.string().describe("A 3-4 paragraph briefing story"),
    time_context: z.object({
        local_time: z.string(),
        timezone: z.string()
    }),
    highlights: z.array(z.object({
        type: z.enum(["calendar", "email", "github", "messages"]),
        title: z.string().max(200),
        detail: z.string().max(500),
        why_it_matters: z.string().max(500),
        urgency: z.enum(["high", "medium", "low"]),
        sources: z.array(z.object({
            kind: z.string(),
            id: z.string(),
            label: z.string()
        }))
    })).max(10), // Removed min(1) to allow empty arrays
    recommendations: z.array(z.object({
        action: z.string().max(200),
        steps: z.array(z.string().max(500)).max(10),
        sources: z.array(z.object({
            kind: z.string(),
            id: z.string(),
            label: z.string()
        }))
    })).max(5),
    rollup: z.object({
        email: z.object({ unread_count: z.number() }),
        calendar: z.object({ today_count: z.number(), next_event_id: z.string().optional() }),
        github: z.object({ active_repos: z.array(z.string()), open_prs: z.number().nullable().optional() })
    }),
    debug: z.object({
        compression: z.object({
            original_input_tokens: z.number(),
            output_tokens: z.number(),
            compression_time: z.number()
        }).optional()
    }).optional()
});

export type Briefing = z.infer<typeof BriefingSchema>;
