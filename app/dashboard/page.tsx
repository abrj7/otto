'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MicButton } from '@/components/voice/MicButton'
import { VoiceStatus } from '@/components/voice/VoiceStatus'
import { Send, RefreshCw, Mail, Calendar, Github, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

// Custom SVG icons for brands
const SlackIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
)

export default function DashboardPage() {
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            setQuery('')
        }, 1000)
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground"></div>
                        <h1 className="text-xl font-semibold text-foreground">{currentDate}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <VoiceStatus status={voiceStatus} />
                        <RefreshCw className="w-4 h-4 text-[#6b6b6b] cursor-pointer hover:text-white" />
                    </div>
                </div>

                {/* Summary */}
                <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                    Good morning! You have <span className="text-foreground font-medium underline underline-offset-4 decoration-border">2 emails</span> from Minimalcompany Gmail that need your review,
                    including a pressing matter regarding carrier issues piling up at The Minimal.
                    Additionally, there&apos;s a <span className="text-foreground font-medium underline underline-offset-4 decoration-border">direct message</span> waiting for your response on Slack.
                </p>

                {/* Insights */}
                <div className="space-y-3">
                    {/* Email Insight */}
                    <InsightItem
                        icon={<Mail className="w-4 h-4" />}
                        title="Re: Andre - carrier issues piling up at The Minimal"
                        subtitle="Follow up on Q4 shipping issues for process improvement"
                        type="email"
                    />

                    {/* Slack DM Insight - Expanded */}
                    <div className="bg-card rounded-lg p-5 space-y-4 border border-border shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center text-accent-foreground">
                                <SlackIcon />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-foreground font-semibold">DM from Alex</h3>
                                <p className="text-muted-foreground text-sm">Get attention approved by Apple today for shipping.</p>
                            </div>
                        </div>
                        <p className="text-[#9b9b9b] text-sm pl-9">
                            You need to obtain approval from Apple for the attention so that shipping can proceed. This
                            task is time-sensitive and needs to be completed today.
                        </p>
                        <div className="flex items-center gap-2 pl-9">
                            <Clock className="w-4 h-4 text-[#6b6b6b]" />
                            <span className="text-[#8a8a8a] text-sm">Get attention approved by Apple</span>
                        </div>
                        <div className="flex items-center justify-between pl-9 pt-2">
                            <div className="flex items-center gap-4">
                                <button className="text-green-500 text-sm font-medium hover:text-green-400">Done</button>
                                <button className="text-[#6b6b6b] text-sm hover:text-white">Ignore</button>
                            </div>
                            <button className="flex items-center gap-1 text-[#6b6b6b] text-sm hover:text-white">
                                View in Slack <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="pl-9 pt-2">
                            <input
                                type="text"
                                placeholder="Add a note or reminder..."
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-[#4b4b4b] focus:outline-none focus:border-white/20"
                            />
                        </div>
                    </div>

                    {/* Calendar Insight */}
                    <InsightItem
                        icon={<Calendar className="w-4 h-4" />}
                        title="TikTok <> The Minimal?"
                        subtitle="Inquire about current TikTok campaigns for potential partnership"
                        type="calendar"
                    />

                    {/* GitHub Insight */}
                    <InsightItem
                        icon={<Github className="w-4 h-4" />}
                        title="PR #142: Feature/voice-integration merged"
                        subtitle="3 new commits pushed to main branch"
                        type="github"
                    />
                </div>

                {/* Query Input */}
                <div className="pt-4">
                    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
                        <MicButton
                            className="flex-shrink-0 w-10 h-10"
                            onTranscript={(text) => setQuery(text)}
                        />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask Otto anything..."
                            className="flex-1 bg-card border-border text-foreground placeholder:text-muted-foreground h-11"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 font-medium"
                        >
                            Send
                        </Button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    )
}

function InsightItem({ icon, title, subtitle, type }: { icon: React.ReactNode; title: string; subtitle: string; type: string }) {
    const bgColors: Record<string, string> = {
        email: 'bg-accent/40',
        calendar: 'bg-accent/40',
        github: 'bg-accent/40',
        slack: 'bg-accent/40'
    }

    return (
        <div className="flex items-start gap-4 py-4 px-4 hover:bg-accent/30 rounded-xl cursor-pointer transition-all duration-200 border border-border bg-card shadow-sm group">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-foreground ${bgColors[type] || 'bg-accent'}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-foreground text-sm font-semibold group-hover:underline underline-offset-4 decoration-border truncate">{title}</h3>
                <p className="text-muted-foreground text-sm truncate">{subtitle}</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
    )
}
