'use client'

import { useState, useEffect } from 'react'
import { Globe, ArrowUpRight, Mic, MicOff } from 'lucide-react'

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
    const [briefing, setBriefing] = useState<BriefingData | null>(null)
    const [isLoadingBriefing, setIsLoadingBriefing] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeSlide, setActiveSlide] = useState(0)
    const [isListening, setIsListening] = useState(false)

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

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Giant Watermark Background Text */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                <h1 className="watermark-text">OTTO</h1>
            </div>

            {/* Top Navigation Bar - Glassmorphism */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
                <div className="glass-card-heavy rounded-full px-8 py-4 flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tracking-tight">O2°</span>
                    </div>
                    <div className="flex gap-6 text-sm font-medium">
                        <button className="hover:text-primary transition-colors">Moonish</button>
                        <button className="hover:text-primary transition-colors">New in</button>
                        <button className="hover:text-primary transition-colors">Hot drops</button>
                        <button className="hover:text-primary transition-colors">Collection</button>
                    </div>
                    <div className="flex items-center gap-4">
                        <Globe className="w-4 h-4" />
                        <button className="pill-button text-xs px-4 py-2">
                            O2 STUDIO<br/>COLLECTION
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="container mx-auto px-8 pt-32 pb-16">
                {/* Hero Glass Card with Number Index */}
                <div className="glass-card-heavy rounded-[3rem] p-12 mb-8 relative overflow-hidden">
                    {/* Number Index */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2">
                        <span className="index-number">01</span>
                    </div>

                    <div className="flex justify-between items-start pt-32">
                        {/* Left Side - Product Details */}
                        <div className="space-y-6 max-w-md">
                            <div>
                                <h2 className="text-sm font-bold tracking-wide mb-2">CLASSIC HOODIE</h2>
                                <p className="text-xs text-muted-foreground">THE LATE 2025</p>
                            </div>
                            <div className="space-y-2 text-xs">
                                <p><span className="font-bold">DETAILS:</span></p>
                                <p>80% COTTON LEFT CHEST<br/>DROPPED HAND POCKETS<br/>3 COLORS</p>
                                <p className="text-muted-foreground">REGULAR FIT/CASUAL</p>
                            </div>
                        </div>

                        {/* Right Side - Actions */}
                        <div className="flex flex-col items-end gap-4">
                            <div>
                                <p className="text-xs font-bold">LIMITED</p>
                                <p className="text-xs">COLLECTION</p>
                            </div>
                            <div>
                                <p className="text-xs">42% POLYESTER</p>
                            </div>
                        </div>
                    </div>

                    {/* Featured Content - Bubble Cards Grid */}
                    <div className="grid grid-cols-2 gap-6 mt-12">
                        {/* Card 1 - GitHub Activity */}
                        <div className="bubble-card p-8 h-80">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold mb-1">GITHUB</h3>
                                        <p className="text-xs text-muted-foreground">RECENT ACTIVITY</p>
                                    </div>
                                    <button className="pill-button text-xs px-4 py-2 arrow-accent">
                                        Open
                                    </button>
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                    {isLoadingBriefing ? (
                                        <div className="text-center">
                                            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"/>
                                            <p className="text-xs text-muted-foreground">Loading...</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="text-4xl font-bold mb-2">{briefing?.connectedServices.includes('github') ? '3' : '0'}</div>
                                            <p className="text-xs text-muted-foreground">commits today</p>
                                        </div>
                                    )}
                                </div>
                                <button className="pill-button w-full mt-auto flex items-center justify-between">
                                    <span className="text-xs">REFRESH</span>
                                    <span className="text-xs">Moonish</span>
                                </button>
                            </div>
                        </div>

                        {/* Card 2 - Calendar */}
                        <div className="bubble-card p-8 h-80 relative">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold mb-1">CALENDAR</h3>
                                        <p className="text-xs text-muted-foreground">UPCOMING EVENTS</p>
                                    </div>
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                    {briefing?.connectedServices.includes('google') ? (
                                        <div className="text-center">
                                            <div className="text-4xl font-bold mb-2">5</div>
                                            <p className="text-xs text-muted-foreground">events this week</p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Connect calendar</p>
                                    )}
                                </div>
                                <button className="pill-button w-full mt-auto arrow-accent">
                                    <span className="text-xs">Add to cart</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Login Button */}
                    <div className="absolute top-8 right-8">
                        <button className="pill-button px-6 py-3 flex items-center gap-2">
                            <span className="text-sm font-medium">Log in</span>
                            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                                <Globe className="w-3 h-3 text-white" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Bottom Bar - New Collection Announcement */}
                <div className="glass-card-heavy rounded-full p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            <span className="text-2xl">🌙</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold tracking-tight">NEW · COSM©</h3>
                            <p className="text-xl font-bold tracking-tight">SET 23↗</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-right text-xs">
                            <p className="font-bold">LIMITED</p>
                            <p className="text-muted-foreground">COLLECTION</p>
                        </div>
                        <button className="w-16 h-16 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-all">
                            <ArrowUpRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Dot Pagination */}
                <div className="flex justify-center gap-2 mt-8">
                    {[0, 1, 2, 3].map((i) => (
                        <button
                            key={i}
                            onClick={() => setActiveSlide(i)}
                            className={`dot ${activeSlide === i ? 'active' : ''}`}
                        />
                    ))}
                </div>
            </div>

            {/* Floating Voice Button */}
            <button
                onClick={() => setIsListening(!isListening)}
                className={`fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isListening
                        ? 'bg-foreground text-background'
                        : 'glass-card hover:scale-110'
                }`}
            >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
        </div>
    )
}
