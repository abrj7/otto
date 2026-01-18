"""
OTTO - LiveKit Voice Agent
Using Google Gemini Live Realtime API
"""

import os
import json
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

from prompts import AGENT_INSTRUCTION, SESSION_INSTRUCTION
from tools import (
    get_github_activity,
    get_unread_emails,
    get_calendar_events,
    create_calendar_event,
    send_email,
    search_web,
    set_current_user_id,
)

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
            instructions=AGENT_INSTRUCTION,
            tools=[
                get_github_activity,
                get_unread_emails,
                get_calendar_events,
                create_calendar_event,
                send_email,
                search_web,
            ],
        )


async def entrypoint(ctx: JobContext):
    """Main entrypoint for the agent"""
    await ctx.connect()

    # Get the user who connected (for API authentication)
    user_id = None
    for participant in ctx.room.remote_participants.values():
        user_id = participant.identity
        print(f"\n🔑 Connected user: {user_id}")
        
        # Try to get from metadata if available
        if participant.metadata:
            try:
                metadata = json.loads(participant.metadata)
                if "user_id" in metadata:
                    user_id = metadata["user_id"]
                    print(f"📋 User ID from metadata: {user_id}")
            except json.JSONDecodeError:
                pass
        break
    
    # Set the user ID for tools to use
    if user_id:
        set_current_user_id(user_id)
    else:
        print("⚠️ No user ID found - APIs will require login")

    # Use Google Gemini Realtime API
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
        instructions=SESSION_INSTRUCTION,
    )


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
