'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MicButton } from '@/components/voice/MicButton'
import { VoiceStatus } from '@/components/voice/VoiceStatus'
import { VoiceOrbs } from '@/components/voice/VoiceOrbs'
import { Send, RefreshCw, Settings, ChevronLeft, Search, FileText, Calendar, MessageSquare, Github, Mail, CheckCircle2, Clock, ArrowRight } from 'lucide-react'

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

// Custom SVG icons for brands
const SlackIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
)

export default function DashboardPage() {
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
    const [isSpeaking, setIsSpeaking] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            setQuery('')
        }, 1000)
    }

    const toggleSpeaking = () => {
        setIsSpeaking(!isSpeaking)
        setVoiceStatus(isSpeaking ? 'idle' : 'speaking')
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-[#0a0a0a]">
                {/* Left teal gradient waves */}
                <div className="absolute left-0 top-0 w-1/2 h-full opacity-60">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-900/40 via-teal-800/20 to-transparent"></div>
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="tealGradDash" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#115e59" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#0d4f4f" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>
                        {tealWavePaths.map((d, i) => (
                            <path
                                key={i}
                                d={d}
                                stroke="url(#tealGradDash)"
                                strokeWidth="2"
                                fill="none"
                                className="animate-wave"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </svg>
                </div>
                
                {/* Right orange gradient waves */}
                <div className="absolute right-0 top-0 w-1/2 h-full opacity-70">
                    <div className="absolute inset-0 bg-gradient-to-l from-orange-600/30 via-orange-700/20 to-transparent"></div>
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="orangeGradDash" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ea580c" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#c2410c" stopOpacity="0.2" />
                            </linearGradient>
                        </defs>
                        {orangeWavePaths.map((d, i) => (
                            <path
                                key={i}
                                d={d}
                                stroke="url(#orangeGradDash)"
                                strokeWidth="1.5"
                                fill="none"
                                className="animate-wave-slow"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            />
                        ))}
                    </svg>
                </div>

                {/* Glassy overlay */}
                <div className="absolute inset-0 backdrop-blur-[1px] bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
            </div>

            {/* Main Layout */}
            <div className="relative z-10 min-h-screen flex">
                {/* Sidebar */}
                <aside className="w-60 bg-[#141414]/60 backdrop-blur-md border-r border-white/5 flex flex-col">
                    {/* Workspace */}
                    <div className="p-3 flex items-center gap-2 border-b border-white/5">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-teal-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            O
                        </div>
                        <span className="text-white text-sm font-medium flex-1">Otto Workspace</span>
                        <ChevronLeft className="w-4 h-4 text-[#6b6b6b]" />
                    </div>

                    {/* Search */}
                    <div className="p-3">
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 text-[#6b6b6b] text-sm hover:bg-white/10">
                            <Search className="w-4 h-4" />
                            <span>Search</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1">
                        <SidebarItem icon={<FileText className="w-4 h-4" />} label="My Briefings" active />
                        <SidebarItem icon={<Calendar className="w-4 h-4" />} label="Calendar" />
                        <SidebarItem icon={<MessageSquare className="w-4 h-4" />} label="Slack Updates" />
                        <SidebarItem icon={<Github className="w-4 h-4" />} label="GitHub Activity" />
                        <SidebarItem icon={<Mail className="w-4 h-4" />} label="Email" />
                    </nav>

                    {/* Settings */}
                    <div className="p-3 border-t border-white/5">
                        <button className="flex items-center gap-2 text-[#8a8a8a] hover:text-white text-sm transition-colors">
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content - Centered */}
                <main className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="w-full max-w-2xl space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <h1 className="text-xl font-semibold text-white">{currentDate}</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <VoiceStatus status={voiceStatus} />
                                <RefreshCw className="w-4 h-4 text-[#6b6b6b] cursor-pointer hover:text-white" />
                            </div>
                        </div>

                        {/* Summary */}
                        <p className="text-[#9b9b9b] text-sm leading-relaxed">
                            Good morning! You have <span className="text-white">2 emails</span> from Minimalcompany Gmail that need your review, 
                            including a pressing matter regarding carrier issues piling up at The Minimal. 
                            Additionally, there&apos;s a <span className="text-white">direct message</span> waiting for your response on Slack, 
                            so be sure to check that as well.
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
                            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 space-y-3 border border-white/5">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded bg-[#4A154B] flex items-center justify-center text-white">
                                        <SlackIcon />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-medium">DM from Alex</h3>
                                        <p className="text-[#6b6b6b] text-sm">Get attention approved by Apple today for shipping.</p>
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
                                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-[#4b4b4b] h-10"
                                    disabled={isLoading}
                                />
                                <Button 
                                    type="submit" 
                                    disabled={isLoading || !query.trim()}
                                    size="icon"
                                    className="bg-white text-[#191919] hover:bg-[#e0e0e0] h-10 w-10"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </main>

                {/* Voice Agent Panel */}
                <aside className="w-72 bg-[#0f0f10]/80 backdrop-blur-md border-l border-white/5 flex flex-col items-center justify-center">
                    <div className="flex-1 flex items-center justify-center">
                        <VoiceOrbs isSpeaking={isSpeaking} />
                    </div>
                    
                    {/* Demo Toggle Button */}
                    <div className="p-6 w-full">
                        <Button
                            onClick={toggleSpeaking}
                            className={`w-full ${isSpeaking 
                                ? 'bg-gradient-to-r from-teal-600 to-orange-600 hover:from-teal-700 hover:to-orange-700' 
                                : 'bg-white/10 hover:bg-white/20'
                            } text-white border-0`}
                        >
                            {isSpeaking ? 'Stop Speaking' : 'Start Speaking'}
                        </Button>
                        <p className="text-[#4b4b4b] text-xs text-center mt-2">
                            Demo: Toggle voice animation
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
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#3b3b3b] flex-shrink-0" />
        </div>
    )
}
