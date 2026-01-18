'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/auth/UserMenu'
import { cn } from '@/lib/utils'
import { Check, Plus, Users, Calendar, RefreshCw, Trash2, Unplug, Info, Moon, Sun, AlertTriangle, X } from 'lucide-react'

interface Integration {
    type: string
    name: string
    description: string
    icon: React.ReactNode
    iconBg: string
    connected: boolean
    provider?: string // OAuth provider name
    comingSoon?: boolean
    animationClass?: string
}

// Custom SVG icons for brands
const SlackIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
)

const GithubIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
)

const NotionIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.934-.56.934-1.166V6.354c0-.606-.233-.933-.747-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.747 0-.934-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.62c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933zM2.708 1.501L16.01.287c1.635-.14 2.055-.047 3.082.7l4.25 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.046-1.448-.093-1.962-.747l-3.129-4.06c-.56-.746-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.455-1.166z" />
    </svg>
)

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

const LinkedInIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
)

const ZoomIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M4.585 6.836h8.536c1.27 0 2.3 1.03 2.3 2.3v5.728c0 1.27-1.03 2.3-2.3 2.3H4.585c-1.27 0-2.3-1.03-2.3-2.3V9.136c0-1.27 1.03-2.3 2.3-2.3zm12.836 2.3l4.294-2.865v11.458l-4.294-2.865V9.136z" />
    </svg>
)

// Confirmation Modal Component
function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    serviceName
}: {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    serviceName: string
}) {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Disconnect {serviceName}?</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            Otto will no longer be able to access your {serviceName} data. You can reconnect anytime.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="flex-1 rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={onConfirm}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                            >
                                Disconnect
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function OnboardingPage() {
    const router = useRouter()
    const [toast, setToast] = useState<string | null>(null)
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; integration: Integration | null }>({
        isOpen: false,
        integration: null
    })
    const [integrations, setIntegrations] = useState<Integration[]>([
        {
            type: 'github',
            name: 'GitHub',
            description: 'Access your repos, PRs, and issues to help with code reviews and project updates.',
            icon: <GithubIcon />,
            iconBg: 'bg-accent',
            connected: false,
            provider: 'github',
        },
        {
            type: 'google',
            name: 'Google Workspace',
            description: 'Read your emails and calendar events for daily briefings and scheduling.',
            icon: <GoogleIcon />,
            iconBg: 'bg-accent',
            connected: false,
            provider: 'google',
        },
        {
            type: 'notion',
            name: 'Notion',
            description: 'Access your Notion workspace for notes, docs, and project management.',
            icon: <NotionIcon />,
            iconBg: 'bg-accent',
            connected: false,
            provider: 'notion',
        },
        {
            type: 'linkedin',
            name: 'LinkedIn',
            description: 'Monitor your LinkedIn activity, messages, and professional network.',
            icon: <LinkedInIcon />,
            iconBg: 'bg-accent',
            connected: false,
            provider: 'linkedin',
        },
        {
            type: 'zoom',
            name: 'Zoom',
            description: 'Access meeting schedules and upcoming calls for better planning.',
            icon: <ZoomIcon />,
            iconBg: 'bg-accent',
            connected: false,
            provider: 'zoom',
        },
        {
            type: 'slack',
            name: 'Slack',
            description: 'Monitor Slack channels and messages for important team updates.',
            icon: <SlackIcon />,
            iconBg: 'bg-accent',
            connected: false,
            provider: 'slack',
            comingSoon: true,
        },
    ])

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.classList.toggle('dark', savedTheme === 'dark')
        } else {
            // Default to light theme to match new design
            document.documentElement.classList.remove('dark')
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
    useEffect(() => {
        if (typeof window === 'undefined') return

        const params = new URLSearchParams(window.location.search)
        const connected = params.get('connected')
        const error = params.get('error')

        if (connected) {
            setIntegrations(prev =>
                prev.map(i => (i.provider === connected ? { ...i, connected: true, animationClass: 'animate-status-connect' } : i))
            )
            setToast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`)
            setTimeout(() => setToast(null), 3000)
            // Clean up URL
            window.history.replaceState({}, '', '/onboarding')
            // Remove animation class after animation completes
            setTimeout(() => {
                setIntegrations(prev =>
                    prev.map(i => (i.provider === connected ? { ...i, animationClass: undefined } : i))
                )
            }, 600)
        }

        if (error) {
            setToast(`Connection failed: ${error}`)
            setTimeout(() => setToast(null), 5000)
            window.history.replaceState({}, '', '/onboarding')
        }
    }, [])

    // Fetch connected integrations on mount
    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await fetch('/api/auth/status')
                const data = await res.json()
                if (data.connected) {
                    setIntegrations(prev =>
                        prev.map(i => ({
                            ...i,
                            connected: data.connected.includes(i.provider),
                        }))
                    )
                }
            } catch (err) {
                console.error('Failed to fetch integration status:', err)
            }
        }
        fetchStatus()
    }, [])

    const handleConnect = (integration: Integration) => {
        if (integration.comingSoon) {
            setToast('Coming soon! Slack integration is under development.')
            setTimeout(() => setToast(null), 3000)
            return
        }

        // Redirect to OAuth (works for both connect and reconnect)
        window.location.href = `/api/auth/${integration.provider}`
    }

    const openDisconnectModal = (integration: Integration) => {
        if (!integration.connected || integration.comingSoon) return
        setConfirmModal({ isOpen: true, integration })
    }

    const handleDisconnect = async () => {
        const integration = confirmModal.integration
        if (!integration) return

        setConfirmModal({ isOpen: false, integration: null })

        try {
            const res = await fetch(`/api/auth/disconnect?provider=${integration.provider}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                // Add disconnect animation first
                setIntegrations(prev =>
                    prev.map(i => (i.provider === integration.provider ? { ...i, animationClass: 'animate-status-disconnect' } : i))
                )

                // Then update connected status after brief delay
                setTimeout(() => {
                    setIntegrations(prev =>
                        prev.map(i => (i.provider === integration.provider ? { ...i, connected: false, animationClass: undefined } : i))
                    )
                }, 400)

                setToast(`${integration.name} disconnected successfully!`)
                setTimeout(() => setToast(null), 3000)
            } else {
                setToast('Failed to disconnect. Please try again.')
                setTimeout(() => setToast(null), 3000)
            }
        } catch (err) {
            console.error('Disconnect error:', err)
            setToast('Failed to disconnect. Please try again.')
            setTimeout(() => setToast(null), 3000)
        }
    }

    const connectedIntegrations = integrations.filter(i => i.connected)
    const connectedCount = connectedIntegrations.length

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, integration: null })}
                onConfirm={handleDisconnect}
                serviceName={confirmModal.integration?.name || ''}
            />

            {/* User Menu - Fixed Top Right */}
            <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-full bg-card border border-border hover:bg-accent transition-all hover:scale-105"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
                <UserMenu />
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border text-foreground px-4 py-3 rounded-lg shadow-lg animate-fade-in">
                    {toast}
                </div>
            )}

            {/* Content Container */}
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row min-h-screen">
                {/* Left Panel - Integrations */}
                <div className="flex-1 p-8 md:p-12 lg:p-16 border-r border-border">
                    <div className="max-w-xl animate-fade-in-up">
                        <h1 className="text-3xl font-[family-name:var(--font-serif)] font-medium tracking-tight mb-2">Connect your tools</h1>
                        <p className="text-muted-foreground mb-12">Select the services otto should monitor for you.</p>

                        {/* Integration Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {integrations.map((integration) => (
                                <div
                                    key={integration.type}
                                    className={cn(
                                        "tooltip-container relative flex flex-col items-center p-6 rounded-2xl bg-card border transition-all duration-300 text-center group min-h-[220px]",
                                        "hover:shadow-lg hover:-translate-y-1 hover:border-muted-foreground/40",
                                        integration.connected
                                            ? "border-foreground/20 ring-1 ring-foreground/10 shadow-md"
                                            : "border-border",
                                        integration.comingSoon && "opacity-60 hover:opacity-70",
                                        integration.animationClass
                                    )}
                                >
                                    {/* Tooltip */}
                                    <div className="tooltip">{integration.description}</div>

                                    {integration.comingSoon && (
                                        <div className="absolute top-2 right-2 text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                                            Soon
                                        </div>
                                    )}
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-accent text-foreground group-hover:scale-110 transition-transform duration-300">
                                        {integration.icon}
                                    </div>
                                    <span className="text-foreground text-sm font-medium h-10 flex items-center">
                                        {integration.name}
                                    </span>
                                    <div className="mt-auto w-full pt-3 flex flex-col items-center gap-2">
                                        {integration.connected ? (
                                            <>
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                                    <Check className="w-3 h-3" /> Connected
                                                </div>
                                                <div className="flex items-center justify-center gap-3 w-full">
                                                    <button
                                                        onClick={() => handleConnect(integration)}
                                                        title="Reconnect"
                                                        className="relative p-2.5 rounded-full bg-accent hover:bg-accent/80 transition-all border border-border/50 hover:border-border group hover:scale-110"
                                                    >
                                                        <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:rotate-180 transition-all duration-500" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openDisconnectModal(integration)
                                                        }}
                                                        title="Disconnect"
                                                        className="relative p-2.5 rounded-full hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 group hover:scale-110"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleConnect(integration)}
                                                disabled={integration.comingSoon}
                                                className={cn(
                                                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]",
                                                    integration.comingSoon
                                                        ? "bg-accent/20 text-muted-foreground cursor-not-allowed"
                                                        : "bg-foreground text-background hover:opacity-90"
                                                )}
                                            >
                                                {integration.comingSoon ? (
                                                    "Coming Soon"
                                                ) : (
                                                    <>
                                                        <Plus className="w-3.5 h-3.5" /> Connect
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 text-muted-foreground text-sm bg-accent/50 p-4 rounded-lg">
                            <Users className="w-4 h-4" />
                            <span>otto never stores your passwords. Connection is handled via secure OAuth.</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Progress */}
                <div className="w-full md:w-80 p-8 md:p-12 bg-background flex flex-col animate-fade-in-up animation-delay-200">
                    <div className="flex-1 flex flex-col justify-start pt-4">
                        <h2 className="text-lg font-[family-name:var(--font-serif)] font-medium mb-1">Your Setup</h2>
                        <p className="text-muted-foreground text-sm mb-8">{connectedCount} services connected</p>

                        <div className="space-y-4">
                            {connectedCount === 0 ? (
                                <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">Awaiting connections</p>
                                </div>
                            ) : (
                                connectedIntegrations.map((integration) => (
                                    <div
                                        key={integration.type}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                                    >
                                        <div className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center
                                            ${integration.iconBg} text-foreground
                                        `}>
                                            {integration.icon}
                                        </div>
                                        <span className="text-foreground text-sm font-medium">
                                            {integration.name}
                                        </span>
                                        <Check className="w-4 h-4 text-foreground ml-auto" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 mt-12">
                        <Button
                            onClick={() => router.push('/dashboard')}
                            disabled={connectedCount === 0}
                            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Continue to Dashboard
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            variant="ghost"
                            className="w-full h-12 text-muted-foreground hover:text-foreground rounded-full font-medium"
                        >
                            Skip for now →
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
