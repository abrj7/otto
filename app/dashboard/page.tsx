'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Zap, ShieldCheck, Mail, Calendar, Github, Sparkles, Clock, X, Info } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default function DashboardPage() {
    const [briefing, setBriefing] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showEfficiencyModal, setShowEfficiencyModal] = useState(false)

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

    // Calculate efficiency percentage
    const efficiencyPercent = briefing?.debug?.compression 
        ? Math.round((1 - (briefing.debug.compression.output_tokens / briefing.debug.compression.original_input_tokens)) * 100)
        : 0

    // --- MAIN EDITORIAL LAYOUT ---
    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto md:py-8 font-sans selection:bg-primary/20 animate-fade-in-up">

                {/* 1. Header: The Masthead */}
                <header className="mb-16 text-center space-y-6">
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

                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {briefing?.time_context?.local_time ? new Date(briefing.time_context.local_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                        {briefing?.debug?.compression && (
                            <button
                                onClick={() => setShowEfficiencyModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-medium border border-green-500/20 hover:bg-green-500/20 transition-colors cursor-pointer group"
                                title="Click to see breakdown"
                            >
                                <Zap className="w-3 h-3 fill-current" />
                                {efficiencyPercent}% Efficient
                                <Info className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => fetchBriefing(true)} className="h-8 w-8 rounded-full hover:bg-muted" title="Regenerate">
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </header>

                <main className="max-w-2xl mx-auto space-y-16">

                    {/* 2. The Narrative (The Core Story) - Enhanced spacing */}
                    {briefing?.narrative ? (
                        <article className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-p:leading-relaxed prose-p:mb-6 prose-headings:mb-4 prose-headings:mt-8 first:prose-headings:mt-0 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-ul:my-6 prose-li:my-2">
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
                        <section className="space-y-8">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Action Items</h3>
                            <div className="space-y-6">
                                {briefing.recommendations.map((rec: any, i: number) => (
                                    <div key={i} className="group relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors py-2">
                                        <h4 className="font-medium text-foreground text-lg group-hover:text-primary transition-colors mb-3">
                                            {rec.action}
                                        </h4>
                                        <ul className="space-y-2">
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

            {/* Efficiency Modal */}
            {showEfficiencyModal && briefing?.debug?.compression && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEfficiencyModal(false)}>
                    <div className="bg-card border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h2 className="text-xl font-serif font-medium flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-green-600 fill-current" />
                                    Token Efficiency
                                </h2>
                                <p className="text-sm text-muted-foreground">Text compression via TTC (Token Transport Company)</p>
                            </div>
                            <button
                                onClick={() => setShowEfficiencyModal(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm text-muted-foreground">Original Tokens</span>
                                    <span className="text-2xl font-serif font-medium text-foreground">
                                        {briefing.debug.compression.original_input_tokens.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm text-muted-foreground">Compressed Tokens</span>
                                    <span className="text-2xl font-serif font-medium text-green-600">
                                        {briefing.debug.compression.output_tokens.toLocaleString()}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-border/50">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-sm font-medium">Tokens Saved</span>
                                        <span className="text-xl font-semibold text-green-600">
                                            {(briefing.debug.compression.original_input_tokens - briefing.debug.compression.output_tokens).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <div className="text-center space-y-1">
                                    <div className="text-4xl font-bold text-green-600">
                                        {efficiencyPercent}%
                                    </div>
                                    <div className="text-sm text-green-700 dark:text-green-400">
                                        More Efficient
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                TTC compresses long text inputs to reduce token usage while preserving meaning
                            </p>
                        </div>
                    </div>
                </div>
            )}
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
