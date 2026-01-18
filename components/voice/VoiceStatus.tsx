'use client'

import { cn } from '@/lib/utils'

interface VoiceStatusProps {
    status: 'idle' | 'connecting' | 'connected' | 'listening' | 'processing' | 'speaking' | 'error'
    className?: string
}

const statusConfig = {
    idle: { label: 'Ready', color: 'bg-green-500' },
    connecting: { label: 'Connecting...', color: 'bg-yellow-500 animate-pulse' },
    connected: { label: 'Connected', color: 'bg-green-500' },
    listening: { label: 'Listening...', color: 'bg-green-500 animate-pulse' },
    processing: { label: 'Processing...', color: 'bg-yellow-500 animate-pulse' },
    speaking: { label: 'otto is speaking', color: 'bg-green-500 animate-pulse' },
    error: { label: 'Error', color: 'bg-red-500' },
}

export function VoiceStatus({ status, className }: VoiceStatusProps) {
    const config = statusConfig[status]

    return (
        <div className={cn('flex items-center gap-2 text-sm', className)}>
            <span className={cn('w-2 h-2 rounded-full', config.color)} />
            <span className="text-muted-foreground">{config.label}</span>
        </div>
    )
}
