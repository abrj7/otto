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
                            "w-12 h-12 rounded-full bg-white transition-all duration-300",
                            isSpeaking 
                                ? "animate-voice-orb" 
                                : "animate-pulse-gentle"
                        )}
                        style={{
                            animationDelay: `${index * 100}ms`,
                            transform: isSpeaking 
                                ? `scaleY(${1 + Math.sin(index * 0.5) * 0.3})` 
                                : 'scaleY(1)',
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
