'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/auth/UserMenu'
import { Check, Plus, Users, Calendar, Video } from 'lucide-react'

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

interface Integration {
    type: string
    name: string
    icon: React.ReactNode
    iconBg: string
    connected: boolean
    provider?: string // OAuth provider name
    comingSoon?: boolean
}

// Custom SVG icons for brands
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
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
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

export default function OnboardingPage() {
    const router = useRouter()
    const [toast, setToast] = useState<string | null>(null)
    const [integrations, setIntegrations] = useState<Integration[]>([
        {
            type: 'github',
            name: 'GitHub',
            icon: <GithubIcon />,
            iconBg: 'bg-[#24292e]',
            connected: false,
            provider: 'github',
        },
        {
            type: 'google',
            name: 'Gmail & Calendar',
            icon: <GoogleIcon />,
            iconBg: 'bg-white',
            connected: false,
            provider: 'google',
        },
        {
            type: 'notion',
            name: 'Notion',
            icon: <NotionIcon />,
            iconBg: 'bg-black border border-[#4d4d4d]',
            connected: false,
            provider: 'notion',
        },
        {
            type: 'linkedin',
            name: 'LinkedIn',
            icon: <LinkedInIcon />,
            iconBg: 'bg-[#0077b5]',
            connected: false,
            provider: 'linkedin',
        },
        {
            type: 'zoom',
            name: 'Zoom',
            icon: <ZoomIcon />,
            iconBg: 'bg-[#2d8cff]',
            connected: false,
            provider: 'zoom',
        },
        {
            type: 'slack',
            name: 'Slack',
            icon: <SlackIcon />,
            iconBg: 'bg-[#4A154B]',
            connected: false,
            comingSoon: true,
        },
    ])

    // Check for OAuth callback results
    useEffect(() => {
        if (typeof window === 'undefined') return

        const params = new URLSearchParams(window.location.search)
        const connected = params.get('connected')
        const error = params.get('error')

        if (connected) {
            setIntegrations(prev =>
                prev.map(i => (i.provider === connected ? { ...i, connected: true } : i))
            )
            setToast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`)
            setTimeout(() => setToast(null), 3000)
            // Clean up URL
            window.history.replaceState({}, '', '/onboarding')
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

        if (integration.connected) {
            // Already connected - could add disconnect functionality here
            return
        }

        // Redirect to OAuth
        window.location.href = `/api/auth/${integration.provider}`
    }

    const connectedIntegrations = integrations.filter(i => i.connected)
    const connectedCount = connectedIntegrations.length

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* User Menu - Fixed Top Right */}
            <div className="fixed top-4 right-4 z-50">
                <UserMenu />
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#2b2b2b] border border-[#3d3d3d] text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in">
                    {toast}
                </div>
            )}

            {/* Gradient Background */}
            <div className="absolute inset-0 bg-[#0a0a0a]">
                {/* Left teal gradient waves */}
                <div className="absolute left-0 top-0 w-1/2 h-full opacity-60">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-900/40 via-teal-800/20 to-transparent"></div>
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="tealGradOnboard" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#115e59" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#0d4f4f" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>
                        {tealWavePaths.map((d, i) => (
                            <path
                                key={i}
                                d={d}
                                stroke="url(#tealGradOnboard)"
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
                            <linearGradient id="orangeGradOnboard" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ea580c" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#c2410c" stopOpacity="0.2" />
                            </linearGradient>
                        </defs>
                        {orangeWavePaths.map((d, i) => (
                            <path
                                key={i}
                                d={d}
                                stroke="url(#orangeGradOnboard)"
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

            {/* Content */}
            <div className="relative z-10 min-h-screen flex">
                {/* Left Panel - Integrations */}
                <div className="flex-1 p-12">
                    <div className="max-w-xl">
                        <h1 className="text-2xl font-bold text-white mb-2">Connect Your Accounts</h1>
                        <p className="text-[#8a8a8a] mb-8">Link your tools so Otto can give you personalized briefings.</p>

                        {/* Integration Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {integrations.map((integration) => (
                                <button
                                    key={integration.type}
                                    onClick={() => handleConnect(integration)}
                                    className={`
                                        relative flex flex-col items-center justify-center p-6 rounded-lg
                                        bg-[#2b2b2b]/60 backdrop-blur-sm hover:bg-[#353535]/80 transition-all border border-white/5
                                        ${integration.connected ? 'ring-2 ring-green-500' : ''}
                                        ${integration.comingSoon ? 'opacity-60' : ''}
                                    `}
                                >
                                    {integration.connected && (
                                        <div className="absolute top-2 right-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                        </div>
                                    )}
                                    {integration.comingSoon && (
                                        <div className="absolute top-2 right-2 text-[10px] text-[#8a8a8a] bg-[#3d3d3d] px-1.5 py-0.5 rounded">
                                            Soon
                                        </div>
                                    )}
                                    <div className={`
                                        w-12 h-12 rounded-lg flex items-center justify-center mb-3
                                        ${integration.iconBg}
                                        ${integration.type === 'google' ? 'text-black' : 'text-white'}
                                    `}>
                                        {integration.icon}
                                    </div>
                                    <span className="text-white text-sm font-medium text-center">
                                        {integration.name}
                                    </span>
                                    {!integration.connected && !integration.comingSoon && (
                                        <Plus className="w-4 h-4 text-[#6b6b6b] mt-1" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 text-[#8a8a8a] text-sm">
                            <div className="w-4 h-4 rounded-full border border-[#6b6b6b] flex items-center justify-center">
                                <span className="text-xs">i</span>
                            </div>
                            Connect at least one account to get started
                        </div>
                    </div>
                </div>

                {/* Right Panel - Connected Accounts */}
                <div className="w-80 bg-[#1a1a1a]/60 backdrop-blur-md p-8 flex flex-col border-l border-white/5">
                    <h2 className="text-lg font-semibold text-white mb-1">Your Accounts</h2>
                    <p className="text-[#8a8a8a] text-sm mb-8">{connectedCount} connected</p>

                    <div className="flex-1 flex flex-col items-center justify-center">
                        {connectedCount === 0 ? (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-[#3d3d3d]/50 flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-[#6b6b6b]" />
                                </div>
                                <p className="text-[#8a8a8a] text-sm">No accounts connected yet</p>
                                <p className="text-[#6b6b6b] text-xs mt-1">Add accounts from the left panel</p>
                            </div>
                        ) : (
                            <div className="w-full space-y-3">
                                {connectedIntegrations.map((integration) => (
                                    <div
                                        key={integration.type}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-[#2b2b2b]/60 backdrop-blur-sm"
                                    >
                                        <div className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center
                                            ${integration.iconBg}
                                            ${integration.type === 'google' ? 'text-black' : 'text-white'}
                                        `}>
                                            {integration.icon}
                                        </div>
                                        <span className="text-white text-sm font-medium">
                                            {integration.name}
                                        </span>
                                        <Check className="w-4 h-4 text-green-500 ml-auto" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 mt-auto">
                        <Button
                            onClick={() => router.push('/dashboard')}
                            disabled={connectedCount === 0}
                            className="w-full h-11 bg-white text-[#191919] hover:bg-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue to Dashboard
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            variant="outline"
                            className="w-full h-11 bg-transparent border-[#3d3d3d] text-white hover:bg-[#2b2b2b] hover:text-white"
                        >
                            Skip for now →
                        </Button>
                    </div>
                </div>

                {/* Bottom Link */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
                    <button
                        onClick={() => router.push('/')}
                        className="text-[#8a8a8a] text-sm hover:text-white transition-colors"
                    >
                        Already have an account? <span className="text-white">Sign in</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
