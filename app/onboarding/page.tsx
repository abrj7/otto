'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, Plus, Users, Mail, Bell, MessageSquare, FileText, Layers, Send, Calendar } from 'lucide-react'
import type { IntegrationType } from '@/types'

interface Integration {
    type: IntegrationType | string
    name: string
    icon: React.ReactNode
    iconBg: string
    connected: boolean
}

export default function OnboardingPage() {
    const router = useRouter()
    const [integrations, setIntegrations] = useState<Integration[]>([
        {
            type: 'email',
            name: 'Email (IMAP)',
            icon: <Mail className="w-6 h-6" />,
            iconBg: 'bg-[#4a9fd4]',
            connected: false,
        },
        {
            type: 'reminders',
            name: 'Reminders',
            icon: <Bell className="w-6 h-6" />,
            iconBg: 'bg-[#f5a623]',
            connected: false,
        },
        {
            type: 'slack',
            name: 'Slack',
            icon: <MessageSquare className="w-6 h-6" />,
            iconBg: 'bg-[#e91e63]',
            connected: false,
        },
        {
            type: 'notion',
            name: 'Notion',
            icon: <FileText className="w-6 h-6" />,
            iconBg: 'bg-black border border-[#4d4d4d]',
            connected: false,
        },
        {
            type: 'linear',
            name: 'Linear',
            icon: <Layers className="w-6 h-6" />,
            iconBg: 'bg-[#5e6ad2]',
            connected: false,
        },
        {
            type: 'outlook',
            name: 'Outlook',
            icon: <Send className="w-6 h-6" />,
            iconBg: 'bg-[#0078d4]',
            connected: false,
        },
        {
            type: 'teams',
            name: 'Teams',
            icon: <Users className="w-6 h-6" />,
            iconBg: 'bg-[#5059c9]',
            connected: false,
        },
        {
            type: 'calendar',
            name: 'Google Calendar',
            icon: <Calendar className="w-6 h-6" />,
            iconBg: 'bg-white',
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
        <div className="min-h-screen bg-[#1e1e1e] flex">
            {/* Left Panel - Integrations */}
            <div className="flex-1 p-12">
                <div className="max-w-xl">
                    <h1 className="text-2xl font-bold text-white mb-2">Add Your Accounts</h1>
                    <p className="text-[#8a8a8a] mb-8">Choose an account you&apos;d like to connect.</p>

                    {/* Integration Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {integrations.map((integration) => (
                            <button
                                key={integration.type}
                                onClick={() => handleConnect(integration.type)}
                                className={`
                                    relative flex flex-col items-center justify-center p-6 rounded-lg
                                    bg-[#2b2b2b] hover:bg-[#353535] transition-all
                                    ${integration.connected ? 'ring-2 ring-green-500' : ''}
                                `}
                            >
                                {integration.connected && (
                                    <div className="absolute top-2 right-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                    </div>
                                )}
                                <div className={`
                                    w-12 h-12 rounded-lg flex items-center justify-center mb-3
                                    ${integration.iconBg}
                                    ${integration.type === 'calendar' ? 'text-black' : 'text-white'}
                                `}>
                                    {integration.icon}
                                </div>
                                <span className="text-white text-sm font-medium text-center">
                                    {integration.name}
                                </span>
                                <Plus className="w-4 h-4 text-[#6b6b6b] mt-1" />
                            </button>
                        ))}
                    </div>

                    <p className="text-[#6b6b6b] text-sm mb-8">More integrations coming soon</p>

                    <div className="flex items-center gap-2 text-[#8a8a8a] text-sm">
                        <div className="w-4 h-4 rounded-full border border-[#6b6b6b] flex items-center justify-center">
                            <span className="text-xs">i</span>
                        </div>
                        Connect at least one account to continue
                    </div>
                </div>
            </div>

            {/* Right Panel - Connected Accounts */}
            <div className="w-80 bg-[#252525] p-8 flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-1">Your Accounts</h2>
                <p className="text-[#8a8a8a] text-sm mb-8">{connectedCount} connected accounts</p>

                <div className="flex-1 flex flex-col items-center justify-center">
                    {connectedCount === 0 ? (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-[#3d3d3d] flex items-center justify-center mx-auto mb-4">
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
                                    className="flex items-center gap-3 p-3 rounded-lg bg-[#2b2b2b]"
                                >
                                    <div className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center
                                        ${integration.iconBg}
                                        ${integration.type === 'calendar' ? 'text-black' : 'text-white'}
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

                <Button
                    onClick={() => router.push('/dashboard')}
                    disabled={connectedCount === 0}
                    className="w-full h-11 bg-[#3d3d3d] text-white hover:bg-[#4d4d4d] disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                >
                    Continue
                </Button>
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
    )
}
