"use client";

import { MicButton } from "./MicButton";
import { VoiceOrbs } from "./VoiceOrbs";
import { VoiceStatus } from "./VoiceStatus";
import { useState } from "react";

export function VoiceAgent() {
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');

    return (
        <div className="flex h-full w-full flex-col bg-background transition-colors duration-200">
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
                {/* Voice Status Indicator */}
                <div className="flex flex-col items-center gap-2">
                    <VoiceStatus status={status} />
                </div>

                {/* Animated Orbs */}
                <div className="relative h-32 flex items-center justify-center">
                    <VoiceOrbs isSpeaking={status === 'speaking' || status === 'listening'} />
                </div>

                {/* Input Controls */}
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <MicButton
                            className="scale-125"
                            onTranscript={(text) => {
                                console.log("Transcript:", text);
                                setStatus('processing');
                                setTimeout(() => setStatus('idle'), 2000);
                            }}
                        />
                    </div>
                </div>

                {/* Helpful Hint */}
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] text-center max-w-[200px] leading-loose">
                    {status === 'idle' ? "Click to start talking to Otto" :
                        status === 'listening' ? "Go ahead, I'm listening..." :
                            "Otto is thinking..."}
                </p>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-accent/5">
                <div className="flex items-center justify-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-foreground/20"></div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        AI Audio Engine v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
