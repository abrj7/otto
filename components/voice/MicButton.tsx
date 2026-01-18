'use client'

import { useState } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MicButtonProps {
    onTranscript?: (text: string) => void
    className?: string
}

export function MicButton({ onTranscript, className }: MicButtonProps) {
    const [isListening, setIsListening] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleClick = async () => {
        if (isProcessing) return

        if (isListening) {
            setIsListening(false)
            setIsProcessing(true)
            // TODO: Stop recording and process
            setTimeout(() => setIsProcessing(false), 1000)
        } else {
            setIsListening(true)
            // TODO: Start LiveKit recording
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={isProcessing}
            className={cn(
                'relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
                'focus:outline-none focus:ring-2 focus:ring-foreground/20',
                isListening && 'bg-foreground text-background animate-pulse',
                isProcessing && 'bg-muted cursor-not-allowed',
                !isListening && !isProcessing && 'bg-accent hover:bg-accent/80',
                className
            )}
        >
            {/* Ripple animation when listening */}
            {isListening && (
                <>
                    <span className="absolute inset-0 rounded-full bg-foreground animate-ping opacity-25" />
                    <span className="absolute inset-0 rounded-full bg-foreground animate-pulse opacity-50" />
                </>
            )}

            {isProcessing ? (
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin relative z-10" />
            ) : isListening ? (
                <MicOff className="w-8 h-8 text-background relative z-10" />
            ) : (
                <Mic className="w-8 h-8 text-foreground relative z-10" />
            )}
        </button>
    )
}
