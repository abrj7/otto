'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MicButton } from '@/components/voice/MicButton'
import { VoiceStatus } from '@/components/voice/VoiceStatus'
import { LiveKitSession, VoiceOrbs, useSessionContext } from '@/components/voice/LiveKitSession'
import { Send, RefreshCw, Settings, ChevronLeft, Search, FileText, Calendar, MessageSquare, Github, Mail, CheckCircle2, Clock, ArrowRight, Phone, PhoneOff } from 'lucide-react'

// Pre-calculated wave paths to avoid hydration mismatch
const tealWavePaths = [
    "M0 0 Q25 500 0 1000",
    "M50 0 Q75 542 50 1000",
    "M100 0 Q125 591 100 1000",
    "M150 0 Q175 507 150 1000",
    "M200 0 Q225 421 200 1000",
    "M250 0 Q275 380 250 1000",
    "M300 0 Q325 410 300 1000",
    "M350 0 Q375 493 350 1000",
    "M400 0 Q425 579 400 1000",
    "M450 0 Q475 620 450 1000",
    "M500 0 Q525 591 500 1000",
    "M550 0 Q575 508 550 1000",
    "M600 0 Q625 420 600 1000",
    "M650 0 Q675 379 650 1000",
    "M700 0 Q725 409 700 1000",
    "M750 0 Q775 492 750 1000",
    "M800 0 Q825 578 800 1000",
    "M850 0 Q875 620 850 1000",
    "M900 0 Q925 591 900 1000",
    "M950 0 Q975 508 950 1000",
]

const orangeWavePaths = [
    "M800 0 Q815 800 800 1000",
    "M830 0 Q845 530 830 1000",
    "M860 0 Q875 669 860 1000",
    "M890 0 Q905 703 890 1000",
    "M920 0 Q935 617 920 1000",
    "M950 0 Q965 479 950 1000",
    "M980 0 Q995 348 980 1000",
    "M1010 0 Q1025 278 1010 1000",
    "M1040 0 Q1055 299 1040 1000",
    "M1070 0 Q1085 404 1070 1000",
    "M1100 0 Q1115 549 1100 1000",
    "M1130 0 Q1145 680 1130 1000",
    "M1160 0 Q1175 748 1160 1000",
    "M1190 0 Q1205 727 1190 1000",
    "M1220 0 Q1235 618 1220 1000",
    "M1250 0 Q1265 462 1250 1000",
    "M1280 0 Q1295 315 1280 1000",
    "M1310 0 Q1325 232 1310 1000",
    "M1340 0 Q1355 248 1340 1000",
    "M1370 0 Q1385 360 1370 1000",
]
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
    return (
        <LiveKitSession>
            <DashboardContent />
        </LiveKitSession>
    )
}

function DashboardContent() {
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    
    // Get session from LiveKit context
    const session = useSessionContext()
    const isConnected = session.isConnected
    const isConnecting = session.connectionState === 'connecting'
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

    const handleVoiceToggle = () => {
        if (isConnected) {
            session.end()
        } else {
            session.start()
        }
    }

    // Map connection state to voice status
    const voiceStatus: 'idle' | 'listening' | 'processing' | 'speaking' = 
        isConnecting ? 'processing' :
        isConnected ? 'listening' :
        'idle'

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

                {/* Voice Agent Panel */}
                <aside className="w-72 bg-[#0f0f10]/80 backdrop-blur-md border-l border-white/5 flex flex-col items-center justify-center">
                    <div className="flex-1 flex items-center justify-center">
                        <VoiceOrbs />
                    </div>
                    
                    {/* Connection Button */}
                    <div className="p-6 w-full space-y-3">
                        <Button
                            onClick={handleVoiceToggle}
                            disabled={isConnecting}
                            className={`w-full flex items-center justify-center gap-2 ${
                                isConnected 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : isConnecting
                                        ? 'bg-yellow-600 hover:bg-yellow-700'
                                        : 'bg-gradient-to-r from-teal-600 to-orange-600 hover:from-teal-700 hover:to-orange-700'
                            } text-white border-0`}
                        >
                            {isConnected ? (
                                <>
                                    <PhoneOff className="w-4 h-4" />
                                    End Call
                                </>
                            ) : isConnecting ? (
                                'Connecting...'
                            ) : (
                                <>
                                    <Phone className="w-4 h-4" />
                                    Talk to Otto
                                </>
                            )}
                        </Button>
                        
                        <p className="text-[#4b4b4b] text-xs text-center">
                            {isConnected 
                                ? 'Speaking with Otto...' 
                                : 'Click to start a voice conversation'}
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    )
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <button className={`
            w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors
            ${active 
                ? 'bg-white/10 text-white' 
                : 'text-[#8a8a8a] hover:bg-white/5 hover:text-white'
            }
        `}>
            {icon}
            <span>{label}</span>
        </button>
    )
}

function InsightItem({ icon, title, subtitle, type }: { icon: React.ReactNode; title: string; subtitle: string; type: string }) {
    const bgColors: Record<string, string> = {
        email: 'bg-blue-600',
        calendar: 'bg-purple-600',
        github: 'bg-[#24292e]',
        slack: 'bg-[#4A154B]'
    }

    return (
        <div className="flex items-start gap-3 py-3 px-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors border border-white/5 bg-white/[0.02] backdrop-blur-sm">
            <div className={`w-6 h-6 rounded flex items-center justify-center text-white ${bgColors[type] || 'bg-gray-600'}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-medium truncate">{title}</h3>
                <p className="text-[#6b6b6b] text-sm truncate">{subtitle}</p>
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
