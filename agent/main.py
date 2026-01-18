"""
OTTO - LiveKit Voice Agent
Main entry point for the Python agent with Google Realtime
"""

import os
import json
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import google, noise_cancellation

from prompts import AGENT_INSTRUCTION, SESSION_INSTRUCTION
from tools import (
    get_github_activity,
    get_unread_emails,
    get_calendar_events,
    create_calendar_event,
    send_email,
    search_web,
    set_current_user_id,  # New function to set user context
)

load_dotenv()


class OttoAgent(Agent):
    """Otto - Voice-first situational awareness agent"""

    def __init__(self) -> None:
        super().__init__(
            instructions=AGENT_INSTRUCTION,
            llm=google.beta.realtime.RealtimeModel(
                voice="Aoede",  # Natural conversational voice
                temperature=0.7,
            ),
            tools=[
                get_github_activity,
                get_unread_emails,
                get_calendar_events,
                create_calendar_event,
                send_email,
                search_web,
            ],
        )


async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint for the agent"""
    await ctx.connect()

    # Get the user who connected (for API authentication)
    user_id = None
    for participant in ctx.room.remote_participants.values():
        # Get user ID from participant identity or metadata
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

    session = AgentSession()

    await session.start(
        room=ctx.room,
        agent=OttoAgent(),
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Greet the user
    await session.generate_reply(
        instructions=SESSION_INSTRUCTION,
    )


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
