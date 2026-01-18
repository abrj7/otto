'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Zap, ShieldCheck, Mail, Calendar, Github, Sparkles, Clock } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default function DashboardPage() {
    const [briefing, setBriefing] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBriefing = async (force: boolean = false) => {
        setLoading(true)
        setError(null)
        try {
            const url = force ? '/api/briefing?force=true' : '/api/briefing'
            const res = await fetch(url)
            if (res.status === 401) {
                setError('Unauthorized')
                return
            }
            if (!res.ok) {
                throw new Error('Failed to fetch briefing')
            }
            const data = await res.json()
            setBriefing(data)
        } catch (err) {
            console.error(err)
            setError('Could not generate briefing. Please ensure services are connected.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBriefing(false)
    }, [])

    if (error === 'Unauthorized') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
                    <div className="max-w-md w-full p-8 rounded-2xl bg-card border shadow-xl text-center space-y-6">
                        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-[family-name:var(--font-serif)] font-medium">Daily Briefing</h1>
                            <p className="text-muted-foreground">Sign in to otto to access your personalized morning summary.</p>
                        </div>
                        <Link href="/" className="block">
                            <Button className="w-full rounded-full hover:scale-[1.02] active:scale-[0.98] transition-transform">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // --- LOADING SKELETON (Paper Style) ---
    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-3xl mx-auto space-y-12 animate-pulse">
                    <div className="space-y-4 text-center">
                        <Skeleton className="h-8 w-48 mx-auto bg-muted/50" />
                        <Skeleton className="h-4 w-32 mx-auto bg-muted/30" />
                    </div>
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <Skeleton className="h-4 w-full bg-muted/40" />
                        <Skeleton className="h-4 w-[90%] bg-muted/40" />
                        <Skeleton className="h-4 w-[95%] bg-muted/40" />
                        <div className="py-4" />
                        <Skeleton className="h-4 w-full bg-muted/40" />
                        <Skeleton className="h-4 w-[85%] bg-muted/40" />
                        <Skeleton className="h-4 w-[90%] bg-muted/40" />
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // --- MAIN EDITORIAL LAYOUT ---
    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto md:py-8 font-sans selection:bg-primary/20 animate-fade-in-up">

                {/* 1. Header: The Masthead */}
                <header className="mb-12 text-center space-y-6">
                    <div className="inline-flex items-center justify-center gap-2 text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5 text-primary">
                            <Sparkles className="w-3 h-3" />
                            otto Intelligence
                        </span>
                        <span className="text-border">|</span>
                        <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-serif)] font-medium tracking-tight text-foreground">
                        {briefing?.greeting || "Good Morning"}
                    </h1>

                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {briefing?.time_context?.local_time ? new Date(briefing.time_context.local_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                        {briefing?.debug?.compression && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-medium border border-green-500/20">
                                <Zap className="w-3 h-3 fill-current" />
                                {Math.round((1 - (briefing.debug.compression.output_tokens / briefing.debug.compression.original_input_tokens)) * 100)}% Efficient
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchBriefing(true)}
                            className="h-8 w-8 rounded-full hover:bg-muted ml-2 hover:scale-110 active:scale-95 transition-transform"
                            title="Regenerate"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </header>

                <main className="max-w-2xl mx-auto space-y-12">

                    {/* 2. The Narrative (The Core Story) */}
                    {briefing?.narrative ? (
                        <article className="prose prose-lg dark:prose-invert prose-headings:font-[family-name:var(--font-serif)] prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                            <ReactMarkdown>{briefing.narrative}</ReactMarkdown>
                        </article>
                    ) : (
                        // Fallback if no narrative generated yet (old schema)
                        <div className="text-center py-10 text-muted-foreground italic font-[family-name:var(--font-serif)]">
                            Wait for the next generation to see your personalized story.
                        </div>
                    )}

                    <hr className="border-border/60 w-16 mx-auto" />

                    {/* 3. Deep Dive: Recommendations */}
                    {briefing?.recommendations?.length > 0 && (
                        <section className="space-y-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Action Items</h3>
                            <div className="space-y-4">
                                {briefing.recommendations.map((rec: any, i: number) => (
                                    <div key={i} className="group relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors py-1">
                                        <h4 className="font-medium text-foreground text-lg group-hover:text-primary transition-colors">
                                            {rec.action}
                                        </h4>
                                        <ul className="mt-2 space-y-1">
                                            {rec.steps?.map((step: string, j: number) => (
                                                <li key={j} className="text-muted-foreground text-sm leading-relaxed">
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 4. The Data Rollup (Footer) */}
                    <footer className="pt-8 mt-12 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
                        <StatItem
                            label="Inbox"
                            value={briefing?.rollup?.email?.unread_count}
                            unit="unread"
                            icon={<Mail className="w-3.5 h-3.5" />}
                        />
                        <StatItem
                            label="Calendar"
                            value={briefing?.rollup?.calendar?.today_count}
                            unit="events"
                            icon={<Calendar className="w-3.5 h-3.5" />}
                        />
                        <StatItem
                            label="GitHub"
                            value={briefing?.rollup?.github?.active_repos?.length}
                            unit="repos"
                            icon={<Github className="w-3.5 h-3.5" />}
                        />
                        <div className="flex flex-col md:items-end justify-center text-xs text-muted-foreground opacity-60">
                            <span>Last updated</span>
                            <span>{new Date().toLocaleTimeString()}</span>
                        </div>
                    </footer>

                </main>
            </div>
        </DashboardLayout>
    )
}

function StatItem({ label, value, unit, icon }: any) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 justify-center md:justify-start">
                {icon} {label}
            </span>
            <div className="flex items-baseline gap-1 justify-center md:justify-start">
                <span className="text-2xl font-[family-name:var(--font-serif)] font-medium text-foreground">
                    {value ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">{unit}</span>
            </div>

        </div>
    )
}
