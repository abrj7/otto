'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Moon, Sun, ArrowRight, Calendar, Mail, Github, FileText, Users, Zap, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Custom SVG icons for integrations
const SlackIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
)

const GithubIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
)

const NotionIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.934-.56.934-1.166V6.354c0-.606-.233-.933-.747-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.747 0-.934-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.62c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933zM2.708 1.501L16.01.287c1.635-.14 2.055-.047 3.082.7l4.25 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.046-1.448-.093-1.962-.747l-3.129-4.06c-.56-.746-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.455-1.166z" />
    </svg>
)

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

const LinkedInIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
)

const ZoomIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M4.585 6.836h8.536c1.27 0 2.3 1.03 2.3 2.3v5.728c0 1.27-1.03 2.3-2.3 2.3H4.585c-1.27 0-2.3-1.03-2.3-2.3V9.136c0-1.27 1.03-2.3 2.3-2.3zm12.836 2.3l4.294-2.865v11.458l-4.294-2.865V9.136z" />
    </svg>
)

// Feature pills data
const featurePills = [
    { icon: Calendar, label: 'Schedule meetings' },
    { icon: Mail, label: 'Draft emails' },
    { icon: Github, label: 'Review PRs' },
    { icon: FileText, label: 'Daily briefings' },
    { icon: Users, label: 'Team updates' },
    { icon: Zap, label: 'Smart actions' },
]

// Integrations data
const integrations = [
    { icon: GithubIcon, name: 'GitHub', color: 'text-foreground' },
    { icon: GoogleIcon, name: 'Google', color: 'text-foreground' },
    { icon: NotionIcon, name: 'Notion', color: 'text-foreground' },
    { icon: LinkedInIcon, name: 'LinkedIn', color: 'text-[#0077B5]' },
    { icon: ZoomIcon, name: 'Zoom', color: 'text-[#2D8CFF]' },
    { icon: SlackIcon, name: 'Slack', color: 'text-foreground' },
]

export default function LandingPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.classList.toggle('dark', savedTheme === 'dark')
        }
    }, [])

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }

    const scrollToFeatures = () => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            {/* Navigation */}
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border" : ""
            )}>
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="text-xl font-[family-name:var(--font-brand)] font-medium tracking-tight">otto</span>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-accent transition-colors"
                        >
                            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                        <Link
                            href="/login"
                            className="px-5 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-all hover:scale-105"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
                <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
                    {/* Pill badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border mb-8 animate-fade-in-up">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-medium">AI-Powered Workflow Assistant</span>
                    </div>

                    {/* Main headline */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-[family-name:var(--font-serif)] font-medium tracking-tight leading-[1.1] mb-6">
                        Rewrite how you
                        <br />
                        <span className="italic">work</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-200">
                        Meet otto, your AI assistant that connects to your calendar, email,
                        and tools to handle the busywork so you can focus on what matters.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up animation-delay-300">
                        <Link
                            href="/login"
                            className="group flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-full text-base font-medium hover:opacity-90 transition-all hover:scale-105 hover:gap-3"
                        >
                            Get Started Free
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <button
                            onClick={scrollToFeatures}
                            className="flex items-center gap-2 px-8 py-4 text-muted-foreground hover:text-foreground transition-colors font-medium"
                        >
                            Learn More
                            <ChevronDown className="w-4 h-4 animate-bounce" />
                        </button>
                    </div>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up animation-delay-400">
                        {featurePills.map((pill, index) => (
                            <div
                                key={pill.label}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-foreground/20 hover:shadow-md transition-all hover:-translate-y-1 cursor-default"
                                style={{ animationDelay: `${400 + index * 50}ms` }}
                            >
                                <pill.icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{pill.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Integrations Section */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left - Integration Orbit */}
                        <div className="relative flex items-center justify-center">
                            <div className="relative w-80 h-80">
                                {/* Center otto logo */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-foreground text-background rounded-2xl flex items-center justify-center text-2xl font-[family-name:var(--font-brand)] shadow-2xl z-10">
                                    o
                                </div>

                                {/* Orbiting integrations */}
                                {integrations.map((integration, index) => {
                                    const angle = (index * 60) - 90
                                    const radius = 120
                                    const x = Math.cos((angle * Math.PI) / 180) * radius
                                    const y = Math.sin((angle * Math.PI) / 180) * radius

                                    return (
                                        <div
                                            key={integration.name}
                                            className="absolute w-14 h-14 bg-card border border-border rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all cursor-pointer animate-float"
                                            style={{
                                                left: `calc(50% + ${x}px - 28px)`,
                                                top: `calc(50% + ${y}px - 28px)`,
                                                animationDelay: `${index * 200}ms`,
                                            }}
                                        >
                                            <integration.icon />
                                        </div>
                                    )
                                })}

                                {/* Connection lines */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                                    {integrations.map((_, index) => {
                                        const angle = (index * 60) - 90
                                        const radius = 120
                                        const x = Math.cos((angle * Math.PI) / 180) * radius
                                        const y = Math.sin((angle * Math.PI) / 180) * radius

                                        return (
                                            <line
                                                key={index}
                                                x1="50%"
                                                y1="50%"
                                                x2={`calc(50% + ${x}px)`}
                                                y2={`calc(50% + ${y}px)`}
                                                stroke="currentColor"
                                                strokeWidth="1"
                                                className="text-border"
                                                strokeDasharray="4 4"
                                            />
                                        )
                                    })}
                                </svg>
                            </div>
                        </div>

                        {/* Right - Content */}
                        <div className="space-y-6">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">#1 Connect</span>
                            <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-serif)] font-medium tracking-tight">
                                Full context,
                                <br />
                                <span className="italic">always</span>
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                                Your assistant connects to your calendar, email, docs, and Slack.
                                It sees what you see, knows what you know, and can act with your full context.
                            </p>
                            <ul className="space-y-3">
                                {['Syncs with all your work tools', 'Understands your ongoing projects', 'Stays up-to-date automatically'].map((item) => (
                                    <li key={item} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-foreground" />
                                        </div>
                                        <span className="text-muted-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-32 px-6 bg-accent/30">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">#2 Capabilities</span>
                        <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-serif)] font-medium tracking-tight mt-4">
                            Smart. Simple. <span className="italic">Powerful.</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Knows your context',
                                description: 'Otto learns from your connected tools to understand your work, preferences, and communication style.',
                                icon: Users,
                            },
                            {
                                title: 'Works like you',
                                description: 'Not a generic assistant. Otto adapts to your tone, your priorities, and how you like things done.',
                                icon: Zap,
                            },
                            {
                                title: 'Always informed',
                                description: 'Real-time sync with all your services means otto is never out of the loop on what matters.',
                                icon: Calendar,
                            },
                        ].map((feature, index) => (
                            <div
                                key={feature.title}
                                className="group p-8 rounded-2xl bg-card border border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-[family-name:var(--font-serif)] font-medium tracking-tight mb-6">
                        Ready to transform
                        <br />
                        how you <span className="italic">work</span>?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
                        Join thousands of professionals who've already upgraded their workflow with otto.
                    </p>
                    <Link
                        href="/login"
                        className="group inline-flex items-center gap-2 px-10 py-5 bg-foreground text-background rounded-full text-lg font-medium hover:opacity-90 transition-all hover:scale-105 hover:gap-3"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-border">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <span className="text-xl font-[family-name:var(--font-brand)] font-medium">otto</span>

                    <div className="flex items-center gap-8 text-sm text-muted-foreground">
                        <span>AI Powered by Gemini</span>
                        <span>Privacy First</span>
                        <span>Open Source</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-accent transition-colors"
                        >
                            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    )
}
