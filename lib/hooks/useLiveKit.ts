'use client'

import { useState, useCallback, useRef } from 'react'
import { Room, RoomEvent } from 'livekit-client'

interface UseLiveKitReturn {
    isConnected: boolean
    isConnecting: boolean
    isMuted: boolean
    error: string | null
    connect: () => Promise<void>
    disconnect: () => Promise<void>
    toggleMute: () => void
}

export function useLiveKit(): UseLiveKitReturn {
    const [isConnected, setIsConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [isMuted, setIsMuted] = useState(true) // Start muted
    const [error, setError] = useState<string | null>(null)
    const roomRef = useRef<Room | null>(null)

    const connect = useCallback(async () => {
        if (isConnected || isConnecting) return

        setIsConnecting(true)
        setError(null)

        try {
            // Fetch token from API
            const response = await fetch('/api/livekit/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: 'user-' + Math.random().toString(36).substring(7),
                    room_name: 'otto-session'
                })
            })

            if (!response.ok) {
                throw new Error('Failed to get LiveKit token')
            }

            const { token, url } = await response.json()

            if (!url) {
                throw new Error('LiveKit URL not provided')
            }

            // Create and connect room
            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: {
                    resolution: { width: 640, height: 480, frameRate: 30 }
                }
            })

            roomRef.current = room

            // Set up event listeners
            room.on(RoomEvent.Connected, () => {
                console.log('Connected to LiveKit room')
                setIsConnected(true)
                setIsConnecting(false)
            })

            room.on(RoomEvent.Disconnected, () => {
                console.log('Disconnected from LiveKit room')
                setIsConnected(false)
                setIsMuted(true)
            })

            room.on(RoomEvent.Reconnecting, () => {
                console.log('Reconnecting to LiveKit...')
            })

            // Connect to room
            await room.connect(url, token)

            // Enable microphone
            await room.localParticipant.setMicrophoneEnabled(!isMuted)

        } catch (err: any) {
            console.error('LiveKit connection error:', err)
            setError(err.message)
            setIsConnecting(false)
            setIsConnected(false)
        }
    }, [isConnected, isConnecting, isMuted])

    const disconnect = useCallback(async () => {
        if (roomRef.current) {
            await roomRef.current.disconnect()
            roomRef.current = null
            setIsConnected(false)
            setIsMuted(true)
        }
    }, [])

    const toggleMute = useCallback(() => {
        if (roomRef.current && isConnected) {
            const newMutedState = !isMuted
            setIsMuted(newMutedState)
            roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState)
        }
    }, [isMuted, isConnected])

    return {
        isConnected,
        isConnecting,
        isMuted,
        error,
        connect,
        disconnect,
        toggleMute
    }
}
