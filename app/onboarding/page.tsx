'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, Plus, Users, Mail, Bell, Calendar } from 'lucide-react'
import type { IntegrationType } from '@/types'

interface Integration {
    type: IntegrationType | string
    name: string
    icon: React.ReactNode
    iconBg: string
    connected: boolean
}

// Custom SVG icons for brands (monochromatic)
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

export default function OnboardingPage() {
    const router = useRouter()
    const [integrations, setIntegrations] = useState<Integration[]>([
        {
            type: 'email',
            name: 'Email (IMAP)',
            icon: <Mail className="w-5 h-5" />,
            iconBg: 'bg-accent/40',
            connected: false,
        },
        {
            type: 'reminders',
            name: 'Reminders',
            icon: <Bell className="w-5 h-5" />,
            iconBg: 'bg-accent/40',
            connected: false,
        },
        {
            type: 'slack',
            name: 'Slack',
            icon: <SlackIcon />,
            iconBg: 'bg-accent/40',
            connected: false,
        },
        {
            type: 'notion',
            name: 'Notion',
            icon: <NotionIcon />,
            iconBg: 'bg-accent/40',
            connected: false,
        },
        {
            type: 'github',
            name: 'GitHub',
            icon: <GithubIcon />,
            iconBg: 'bg-accent/40',
            connected: false,
        },
        {
            type: 'calendar',
            name: 'Google Calendar',
            icon: <Calendar className="w-5 h-5" />,
            iconBg: 'bg-accent/40',
            connected: false,
        },
    ])

    const handleConnect = (type: string) => {
        setIntegrations(prev =>
            prev.map(i => (i.type === type ? { ...i, connected: !i.connected } : i))
        )
    }

    const connectedIntegrations = integrations.filter(i => i.connected)
    const connectedCount = connectedIntegrations.length

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
            {/* Content Container */}
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row min-h-screen">
                {/* Left Panel - Integrations */}
                <div className="flex-1 p-8 md:p-12 lg:p-16 border-r border-border">
                    <div className="max-w-xl">
                        <h1 className="text-3xl font-semibold tracking-tight mb-2">Connect your tools</h1>
                        <p className="text-muted-foreground mb-12">Select the services Otto should monitor for you.</p>

                        {/* Integration Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {integrations.map((integration) => (
                                <button
                                    key={integration.type}
                                    onClick={() => handleConnect(integration.type)}
                                    className={`
                                        relative flex flex-col items-center justify-center p-8 rounded-xl
                                        bg-card border transition-all duration-200 text-center
                                        ${integration.connected
                                            ? 'border-foreground ring-1 ring-foreground'
                                            : 'border-border hover:border-muted-foreground hover:bg-accent/50'
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-12 h-12 rounded-lg flex items-center justify-center mb-4
                                        ${integration.iconBg} text-foreground
                                    `}>
                                        {integration.icon}
                                    </div>
                                    <span className="text-foreground text-sm font-medium">
                                        {integration.name}
                                    </span>
                                    <div className="mt-4">
                                        {integration.connected ? (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                                                <Check className="w-3 h-3" /> Connected
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Plus className="w-3 h-3" /> Connect
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 text-muted-foreground text-sm bg-accent/30 p-4 rounded-lg">
                            <Users className="w-4 h-4" />
                            <span>Otto never stores your passwords. Connection is handled via secure OAuth.</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Progress */}
                <div className="w-full md:w-80 p-8 md:p-12 bg-accent/10 flex flex-col">
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold mb-1">Your Setup</h2>
                        <p className="text-muted-foreground text-sm mb-12">{connectedCount} services connected</p>

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
                            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-lg font-medium transition-all"
                        >
                            Complete Setup
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            variant="ghost"
                            className="w-full h-12 text-muted-foreground hover:text-foreground rounded-lg font-medium"
                        >
                            Skip for now →
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
