'use client';

import { useMemo } from 'react';
import { TokenSource } from 'livekit-client';
import {
  RoomAudioRenderer,
  SessionProvider,
  StartAudio,
  useSession,
  useSessionContext,
} from '@livekit/components-react';

/**
 * Hook to get LiveKit session context
 * Use this in components that need session state/controls
 */
export { useSessionContext } from '@livekit/components-react';

interface LiveKitSessionProps {
  children: React.ReactNode;
}

/**
 * LiveKitSession wrapper component
 * Provides session context to all child components
 */
export function LiveKitSession({ children }: LiveKitSessionProps) {
  // Create token source pointing to our API
  const tokenSource = useMemo(() => {
    return TokenSource.endpoint('/api/connection-details');
  }, []);

  // Initialize session with token source
  const session = useSession(tokenSource);

  return (
    <SessionProvider session={session}>
      {children}
      {/* Renders agent audio output */}
      <RoomAudioRenderer />
      {/* Handles audio autoplay permissions */}
      <StartAudio label="Click to enable audio" />
    </SessionProvider>
  );
}

/**
 * VoiceOrbs that animate based on session state
 */
export function VoiceOrbs({ className }: { className?: string }) {
  const session = useSessionContext();
  
  // Animate when connected and agent is speaking (audio is playing)
  const isAnimating = session.isConnected;
  
  return (
    <div className={`flex items-center justify-center gap-2 ${className || ''}`}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`
            w-3 h-3 rounded-full bg-white/80
            transition-all duration-300
            ${isAnimating 
              ? 'animate-pulse scale-110' 
              : 'opacity-60 scale-100'
            }
          `}
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
