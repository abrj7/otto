"use client";

import { useState, useCallback, useEffect } from "react";
import { VoiceOrbs } from "./VoiceOrbs";
import { VoiceStatus } from "./VoiceStatus";
import { Mic, MicOff, Loader2 } from "lucide-react";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useVoiceAssistant,
    BarVisualizer,
} from "@livekit/components-react";
import "@livekit/components-styles";

type ConnectionDetails = {
    serverUrl: string;
    roomName: string;
    participantName: string;
    participantToken: string;
};

export function VoiceAgent() {
    const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connect = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        try {
            const response = await fetch("/api/connection-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const details = await response.json();
            setConnectionDetails(details);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Connection failed");
            console.error("Connection error:", err);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setConnectionDetails(null);
    }, []);

    return (
        <div className="flex h-full w-full flex-col bg-background transition-colors duration-200">
            {connectionDetails ? (
                <LiveKitRoom
                    token={connectionDetails.participantToken}
                    serverUrl={connectionDetails.serverUrl}
                    connect={true}
                    audio={true}
                    video={false}
                    onDisconnected={disconnect}
                    className="flex-1 flex flex-col"
                >
                    <RoomAudioRenderer />
                    <AgentView onDisconnect={disconnect} />
                </LiveKitRoom>
            ) : (
                <DisconnectedView
                    onConnect={connect}
                    isConnecting={isConnecting}
                    error={error}
                />
            )}

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

function AgentView({ onDisconnect }: { onDisconnect: () => void }) {
    const { state, audioTrack } = useVoiceAssistant();

    const status = state === "speaking"
        ? "speaking"
        : state === "listening"
            ? "listening"
            : "processing";

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
            {/* Voice Status Indicator */}
            <div className="flex flex-col items-center gap-2">
                <VoiceStatus status={status} />
            </div>

            {/* Audio Visualizer */}
            <div className="relative h-32 w-full max-w-xs flex items-center justify-center">
                {audioTrack ? (
                    <BarVisualizer
                        state={state}
                        barCount={5}
                        trackRef={audioTrack}
                        className="h-24"
                    />
                ) : (
                    <VoiceOrbs isSpeaking={state === "speaking"} />
                )}
            </div>

            {/* Disconnect Button */}
            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={onDisconnect}
                    className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 bg-foreground text-background animate-pulse focus:outline-none focus:ring-2 focus:ring-foreground/20"
                >
                    <span className="absolute inset-0 rounded-full bg-foreground animate-ping opacity-25" />
                    <MicOff className="w-8 h-8 relative z-10" />
                </button>
            </div>

            {/* Listening Hint */}
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] text-center max-w-[200px] leading-loose">
                {state === "listening" ? "Go ahead, I'm listening..." :
                    state === "speaking" ? "otto is speaking..." :
                        "otto is thinking..."}
            </p>
        </div>
    );
}

function DisconnectedView({
    onConnect,
    isConnecting,
    error,
}: {
    onConnect: () => void;
    isConnecting: boolean;
    error: string | null;
}) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
            {/* Voice Status */}
            <div className="flex flex-col items-center gap-2">
                <VoiceStatus status="idle" />
            </div>

            {/* Orbs */}
            <div className="relative h-32 flex items-center justify-center">
                <VoiceOrbs isSpeaking={false} />
            </div>

            {/* Connect Button */}
            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className={`
                        relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                        focus:outline-none focus:ring-2 focus:ring-foreground/20
                        ${isConnecting ? 'bg-muted cursor-not-allowed' : 'bg-accent hover:bg-accent/80'}
                    `}
                >
                    {isConnecting ? (
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    ) : (
                        <Mic className="w-8 h-8 text-foreground" />
                    )}
                </button>
            </div>

            {/* Error or Hint */}
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] text-center max-w-[200px] leading-loose">
                {error ? (
                    <span className="text-red-500">{error}</span>
                ) : isConnecting ? (
                    "Connecting..."
                ) : (
                    "Click to start talking to otto"
                )}
            </p>
        </div>
    );
}
