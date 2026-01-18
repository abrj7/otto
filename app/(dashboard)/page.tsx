'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MicButton } from '@/components/voice/MicButton'
import { VoiceStatus } from '@/components/voice/VoiceStatus'
import { VoiceOrbs } from '@/components/voice/VoiceOrbs'
import { SummaryBlock } from '@/components/blocks/SummaryBlock'
import { ReceiptsBlock } from '@/components/blocks/ReceiptsBlock'
import { TokenStatsBlock } from '@/components/blocks/TokenStatsBlock'
import type { QueryResponse } from '@/types'
import { Send, RefreshCw, Settings, ChevronLeft, Search, Plus, FileText, Calendar, MessageSquare, Github } from 'lucide-react'

export default function DashboardPage() {
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [response, setResponse] = useState<QueryResponse | null>(null)
    const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
    const [isSpeaking, setIsSpeaking] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setIsLoading(true)
        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query.trim(),
                    workspace_id: 'demo',
                }),
            })
            const data = await res.json()
            setResponse(data)
        } catch (error) {
            console.error('Query failed:', error)
        } finally {
            setIsLoading(false)
            setQuery('')
        }
    }

    // Demo toggle for voice orbs animation
    const toggleSpeaking = () => {
        setIsSpeaking(!isSpeaking)
        setVoiceStatus(isSpeaking ? 'idle' : 'speaking')
    }

    return (
        <div className="min-h-screen bg-[#191919] flex">
            {/* Sidebar */}
            <aside className="w-60 bg-[#202020] border-r border-[#2d2d2d] flex flex-col">
                {/* Workspace */}
                <div className="p-3 flex items-center gap-2 border-b border-[#2d2d2d]">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        O
                    </div>
                    <span className="text-white text-sm font-medium flex-1">Otto Workspace</span>
                    <ChevronLeft className="w-4 h-4 text-[#6b6b6b]" />
                </div>

                {/* Search */}
                <div className="p-3">
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-[#2b2b2b] text-[#6b6b6b] text-sm hover:bg-[#353535]">
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
                </nav>

                {/* Settings */}
                <div className="p-3 border-t border-[#2d2d2d]">
                    <button className="flex items-center gap-2 text-[#8a8a8a] hover:text-white text-sm transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-12 border-b border-[#2d2d2d] flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#8a8a8a]" />
                        <span className="text-white text-sm">My Briefings</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <VoiceStatus status={voiceStatus} />
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {/* Page Title */}
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Today&apos;s Briefing
                            </h1>
                            <p className="text-[#8a8a8a]">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>

                        {/* Query Input */}
                        <Card className="bg-[#252525] border-[#3d3d3d]">
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="flex gap-4 items-center">
                                    <MicButton
                                        className="flex-shrink-0"
                                        onTranscript={(text) => setQuery(text)}
                                    />
                                    <div className="flex-1 flex gap-2">
                                        <Input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Ask Otto anything... e.g., &quot;What changed since yesterday?&quot;"
                                            className="flex-1 bg-[#2b2b2b] border-[#3d3d3d] text-white placeholder:text-[#6b6b6b]"
                                            disabled={isLoading}
                                        />
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading || !query.trim()}
                                            className="bg-white text-[#191919] hover:bg-[#e0e0e0]"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Response */}
                        {response && (
                            <div className="space-y-4">
                                <SummaryBlock content={response.summary} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ReceiptsBlock receipts={response.receipts} />
                                    <TokenStatsBlock stats={response.token_stats} />
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!response && (
                            <Card className="bg-[#252525] border-[#3d3d3d]">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <span>📋</span> Getting Started
                                    </CardTitle>
                                    <CardDescription className="text-[#8a8a8a]">
                                        Connect your accounts and ask Otto about your workflow
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-[#6b6b6b] mb-4">
                                        Try asking: &ldquo;What do I need to care about today?&rdquo;
                                    </p>
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        className="bg-[#3d3d3d] text-white hover:bg-[#4d4d4d]"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Generate Briefing
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>

            {/* Voice Agent Panel */}
            <aside className="w-80 bg-[#1c1c1e] border-l border-[#2d2d2d] flex flex-col items-center justify-center">
                <div className="flex-1 flex items-center justify-center">
                    <VoiceOrbs isSpeaking={isSpeaking} />
                </div>
                
                {/* Demo Toggle Button */}
                <div className="p-6 w-full">
                    <Button
                        onClick={toggleSpeaking}
                        className={`w-full ${isSpeaking 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'bg-[#3d3d3d] hover:bg-[#4d4d4d]'
                        } text-white`}
                    >
                        {isSpeaking ? 'Stop Speaking' : 'Start Speaking'}
                    </Button>
                    <p className="text-[#6b6b6b] text-xs text-center mt-2">
                        Demo: Toggle voice animation
                    </p>
                </div>
            </aside>
        </div>
    )
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <button className={`
            w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors
            ${active 
                ? 'bg-[#353535] text-white' 
                : 'text-[#8a8a8a] hover:bg-[#2b2b2b] hover:text-white'
            }
        `}>
            {icon}
            <span>{label}</span>
        </button>
    )
}
