'use client'

import { cn } from '@/lib/utils'

interface VoiceOrbsProps {
    isSpeaking?: boolean
    className?: string
}

export function VoiceOrbs({ isSpeaking = false, className }: VoiceOrbsProps) {
    return (
        <div className={cn(
            "flex items-center justify-center gap-2 p-8",
            className
        )}>
            <div className="flex items-center justify-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className={cn(
                            "w-12 h-12 rounded-full bg-foreground/20 transition-all duration-300",
                            (isSpeaking || !isSpeaking) && "animate-pulse"
                        )}
                        style={{
                            animationDelay: `${index * 150}ms`,
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
