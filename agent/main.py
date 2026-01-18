"""
OTTO - LiveKit Voice Agent
Using Google Gemini Live Realtime API
"""

import os
from pathlib import Path
from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    WorkerOptions,
    cli,
)
from livekit.plugins import silero
from livekit.plugins import google

# Load .env.local from project root (parent of agent directory)
project_root = Path(__file__).parent.parent
env_file = project_root / ".env.local"
if env_file.exists():
    load_dotenv(env_file)
else:
    load_dotenv()


class OttoAgent(Agent):
    """Otto - Voice-first situational awareness agent"""

    def __init__(self) -> None:
        super().__init__(
            instructions="""You are Otto, a voice-first situational awareness agent for engineering teams.
You speak like a calm senior engineer giving a standup update—factual, brief, no filler.

Rules:
- Only use provided data, never invent or speculate
- Prefer short, spoken sentences
- No markdown, emojis, or complex formatting
- Answer naturally as if speaking aloud
- When listing items, use "First..., Second..., Third..."
"""
        )


async def entrypoint(ctx: JobContext):
    """Main entrypoint for the agent"""
    await ctx.connect()

    # Use Google Gemini Realtime API directly
    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            model="gemini-2.5-flash-native-audio-preview-09-2025",
        ),
        vad=silero.VAD.load(),
    )

    await session.start(
        room=ctx.room,
        agent=OttoAgent(),
    )

    # Greet the user
    await session.generate_reply(
        instructions="Greet the user briefly. Say something like 'Hey, I'm Otto. What do you need to know?'"
    )


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
