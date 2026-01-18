'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MicButton } from '@/components/voice/MicButton'
import { VoiceStatus } from '@/components/voice/VoiceStatus'
import { Send, RefreshCw, Mail, Calendar, Github, ArrowRight, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'

interface Insight {
    id: string
    type: string
    title: string
    subtitle: string
    source: string
}

interface BriefingData {
    connectedServices: string[]
    summary: string
    insights: Insight[]
}

export default function DashboardPage() {
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
    const [briefing, setBriefing] = useState<BriefingData | null>(null)
    const [isLoadingBriefing, setIsLoadingBriefing] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBriefing = async () => {
        setIsLoadingBriefing(true)
        setError(null)
        try {
            const response = await fetch('/api/briefing')
            if (!response.ok) {
                if (response.status === 401) {
                    setError('Please log in to see your briefing.')
                    return
                }
                throw new Error('Failed to fetch briefing')
            }
            const data = await response.json()
            setBriefing(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoadingBriefing(false)
        }
    }

    useEffect(() => {
        fetchBriefing()
    }, [])

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

    const getIconForType = (type: string) => {
        switch (type) {
            case 'calendar':
                return <Calendar className="w-4 h-4" />
            case 'github':
                return <Github className="w-4 h-4" />
            case 'email':
                return <Mail className="w-4 h-4" />
            default:
                return <ArrowRight className="w-4 h-4" />
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-foreground animate-pulse"></div>
                        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{currentDate}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <VoiceStatus status={voiceStatus} />
                        <button
                            onClick={fetchBriefing}
                            disabled={isLoadingBriefing}
                            className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoadingBriefing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoadingBriefing && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                            Loading your briefing...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoadingBriefing && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                        <p className="text-foreground font-medium mb-2">{error}</p>
                        <Link href="/">
                            <Button variant="outline" className="mt-4">
                                Go to Login
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Main Content */}
                {briefing && !isLoadingBriefing && (
                    <>
                        {/* Summary */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <p className="text-foreground leading-relaxed">
                                {briefing.summary}
                            </p>

                            {/* Connected Services Badge */}
                            {briefing.connectedServices.length > 0 && (
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Connected:</span>
                                    <div className="flex gap-2">
                                        {briefing.connectedServices.map(service => (
                                            <span
                                                key={service}
                                                className="text-xs bg-accent px-2 py-1 rounded-md text-foreground capitalize"
                                            >
                                                {service}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* No Connections Prompt */}
                        {briefing.connectedServices.length === 0 && (
                            <div className="bg-accent/20 border-2 border-dashed border-border rounded-xl p-8 text-center">
                                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">No services connected</h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Connect your GitHub, Google Calendar, and other services to see real updates here.
                                </p>
                                <Link href="/onboarding">
                                    <Button className="bg-primary text-primary-foreground">
                                        Connect Services
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Insights */}
                        {briefing.insights.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                                    Recent Activity
                                </h2>
                                <div className="space-y-2">
                                    {briefing.insights.map((insight) => (
                                        <div
                                            key={insight.id}
                                            className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:bg-accent/30 transition-all cursor-pointer group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center text-foreground">
                                                {getIconForType(insight.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-foreground text-sm font-semibold group-hover:underline underline-offset-4 decoration-border truncate">
                                                    {insight.title}
                                                </h3>
                                                <p className="text-muted-foreground text-sm truncate">
                                                    {insight.subtitle} • {insight.source}
                                                </p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Query Input */}
                <div className="pt-4 border-t border-border">
                    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
                        <MicButton
                            className="flex-shrink-0 w-12 h-12"
                            onTranscript={(text) => setQuery(text)}
                        />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask Otto anything..."
                            className="flex-1 bg-card border-border text-foreground placeholder:text-muted-foreground h-12"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 font-medium"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    )
}
