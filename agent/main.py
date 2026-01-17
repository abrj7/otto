"""
OTTO - LiveKit Voice Agent
Main entry point for the Python agent
"""

import os
import httpx
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import silero

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:3000")
WORKSPACE_ID = os.getenv("WORKSPACE_ID", "demo")


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


async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint for the agent"""
    await ctx.connect()

    session = AgentSession(
        stt="deepgram",  # or "assemblyai"
        llm="google",
        tts="cartesia",
        vad=silero.VAD.load(),
    )

    await session.start(
        room=ctx.room,
        agent=OttoAgent(),
        room_input_options=RoomInputOptions(
            # Enable noise cancellation if available
        ),
    )

    # Greet the user
    await session.generate_reply(
        instructions="Greet the user briefly. Say something like 'Hey, I'm Otto. What do you need to know?'"
    )


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
