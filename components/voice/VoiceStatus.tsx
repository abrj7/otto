'use client'

import { cn } from '@/lib/utils'

interface VoiceStatusProps {
    status: 'idle' | 'connecting' | 'connected' | 'listening' | 'processing' | 'speaking' | 'error'
    className?: string
}

const statusConfig = {
    idle: { label: 'Ready', color: 'bg-muted-foreground/30' },
    connecting: { label: 'Connecting...', color: 'bg-muted-foreground/50 animate-pulse' },
    connected: { label: 'Connected', color: 'bg-foreground' },
    listening: { label: 'Listening...', color: 'bg-foreground animate-pulse' },
    processing: { label: 'Processing...', color: 'bg-muted-foreground animate-pulse' },
    speaking: { label: 'otto is speaking', color: 'bg-foreground animate-pulse' },
    error: { label: 'Error', color: 'bg-muted-foreground' },
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
