"""
OTTO - LiveKit Voice Agent with Data Integration
Main entry point for the Python agent with function calling
"""

import os
import httpx
import json
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, llm
from livekit.plugins import silero

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:3000")
WORKSPACE_ID = os.getenv("WORKSPACE_ID", "demo")


# Define tools for the agent
class EmailTool(llm.FunctionTool):
    """Fetch emails from Gmail"""
    
    def __init__(self):
        super().__init__(
            name="get_emails",
            description="Fetch recent emails from the user's Gmail inbox. Use this when the user asks about their emails.",
            parameters={
                "limit": llm.TypeInfo(
                    type=llm.TypeInfo.Type.NUMBER,
                    description="Number of emails to fetch (1-10)",
                    default=5
                ),
                "include_body": llm.TypeInfo(
                    type=llm.TypeInfo.Type.BOOLEAN,
                    description="Whether to include full email content for summarization",
                    default=False
                )
            }
        )
    
    async def execute(self, limit: int = 5, include_body: bool = False, **kwargs) -> str:
        """Execute the email fetch"""
        # Get user_id from agent context
        user_id = kwargs.get('user_id', '')
        if not user_id:
            return "Error: Unable to identify user"
            
        try:
            async with httpx.AsyncClient() as client:
                url = f"{API_URL}/api/agent/gmail?user_id={user_id}&limit={limit}&full={'true' if include_body else 'false'}"
                response = await client.get(url, timeout=10.0)
                
                if response.status_code != 200:
                    return f"Error fetching emails: {response.text}"
                
                data = response.json()
                messages = data.get('messages', [])
                
                if not messages:
                    return "No emails found in your inbox."
                
                # Format for AI
                result = f"Found {len(messages)} email(s):\n\n"
                for i, msg in enumerate(messages, 1):
                    result += f"{i}. From: {msg['from']}\n"
                    result += f"   Subject: {msg['subject']}\n"
                    if include_body and msg.get('body'):
                        result += f"   Content: {msg['body'][:500]}...\n"
                    else:
                        result += f"   Preview: {msg['snippet']}\n"
                    result += f"   Time: {msg['timeAgo']}\n\n"
                
                return result
        except Exception as e:
            return f"Error: {str(e)}"


class CalendarTool(llm.FunctionTool):
    """Fetch calendar events"""
    
    def __init__(self):
        super().__init__(
            name="get_calendar",
            description="Fetch upcoming calendar events. Use this when the user asks about their schedule or meetings.",
            parameters={
                "timeframe": llm.TypeInfo(
                    type=llm.TypeInfo.Type.STRING,
                    description="Time range: 'today', 'week', or 'next-event'",
                    default="today"
                )
            }
        )
    
    async def execute(self, timeframe: str = "today", **kwargs) -> str:
        """Execute the calendar fetch"""
        # Get user_id from agent context
        user_id = kwargs.get('user_id', '')
        if not user_id:
            return "Error: Unable to identify user"
            
        try:
            async with httpx.AsyncClient() as client:
                url = f"{API_URL}/api/agent/calendar?user_id={user_id}&timeframe={timeframe}"
                response = await client.get(url, timeout=10.0)
                
                if response.status_code != 200:
                    return f"Error fetching calendar: {response.text}"
                
                data = response.json()
                events = data.get('events', [])
                
                if not events:
                    if timeframe == "today":
                        return "You have no meetings scheduled for today."
                    elif timeframe == "next-event":
                        return "You have no upcoming meetings."
                    else:
                        return "You have no meetings scheduled this week."
                
                # Format for AI
                if timeframe == "next-event":
                    event = events[0]
                    return f"Your next meeting is '{event['title']}' at {event['start']}."
                
                result = f"You have {len(events)} event(s):\n\n"
                for i, event in enumerate(events, 1):
                    result += f"{i}. {event['title']}\n"
                    result += f"   Time: {event['start']}\n"
                    if event.get('location'):
                        result += f"   Location: {event['location']}\n"
                    result += "\n"
                
                return result
        except Exception as e:
            return f"Error: {str(e)}"


class GitHubTool(llm.FunctionTool):
    """Fetch GitHub activity"""
    
    def __init__(self):
        super().__init__(
            name="get_github",
            description="Fetch GitHub repositories and activity. Use this when the user asks about their code or projects.",
            parameters={}
        )
    
    async def execute(self, **kwargs) -> str:
        """Execute the GitHub fetch"""
        # Get user_id from agent context
        user_id = kwargs.get('user_id', '')
        if not user_id:
            return "Error: Unable to identify user"
            
        try:
            async with httpx.AsyncClient() as client:
                url = f"{API_URL}/api/agent/github?user_id={user_id}"
                response = await client.get(url, timeout=10.0)
                
                if response.status_code != 200:
                    return f"Error fetching GitHub data: {response.text}"
                
                data = response.json()
                repos = data.get('repos', [])
                
                if not repos:
                    return "No GitHub repositories found."
                
                # Format for AI
                result = f"You have {len(repos)} active repositories:\n\n"
                for i, repo in enumerate(repos[:5], 1):  # Top 5
                    result += f"{i}. {repo['fullName']}\n"
                    if repo.get('description'):
                        result += f"   {repo['description']}\n"
                    result += f"   Updated: {repo['updatedAt']}\n\n"
                
                return result
        except Exception as e:
            return f"Error: {str(e)}"


class OttoAgent(Agent):
    """Otto - Voice-first situational awareness agent with data access"""

    def __init__(self) -> None:
        super().__init__(
            instructions="""You are Otto, a voice-first personal assistant with access to the user's email, calendar, and GitHub.

When the user asks about their data, you MUST use the available tools:
- get_emails: For questions about emails or inbox
- get_calendar: For questions about schedule or meetings
- get_github: For questions about code or projects

Rules:
- Always call the appropriate tool before answering questions about user data
- Never guess or make up information
- Speak naturally and concisely, as if having a conversation
- Use "First..., Second..., Third..." when listing items
- No markdown, emojis, or complex formatting in your speech

Examples:
- "What are my emails?" → Call get_emails(limit=5, include_body=false)
- "Summarize my last 3 emails" → Call get_emails(limit=3, include_body=true)
- "What's on my calendar today?" → Call get_calendar(timeframe="today")
- "When is my next meeting?" → Call get_calendar(timeframe="next-event")
- "What repos am I working on?" → Call get_github()
""",
            tools=[
                EmailTool(),
                CalendarTool(),
                GitHubTool()
            ]
        )


async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint for the agent"""
    await ctx.connect()

    # Extract user_id from the participant who joined
    user_id = None
    for participant in ctx.room.remote_participants.values():
        if participant.identity:
            user_id = participant.identity
            break
    
    if not user_id:
        print("Warning: No user_id found in room participants")
        user_id = "unknown"

    # Fetch initial context
    initial_context = ''
    try:
        async with httpx.AsyncClient() as client:
            # Note: context endpoint doesn't need user_id since it uses session
            # For now, skip context fetch or implement a user_id version
            pass
    except Exception as e:
        print(f"Context fetch error: {e}")

    # Create agent with user_id in context
    agent = OttoAgent()
    
    # Monkey-patch tool execute methods to inject user_id
    original_email_execute = agent.tools[0].execute
    original_calendar_execute = agent.tools[1].execute
    original_github_execute = agent.tools[2].execute
    
    async def email_with_context(*args, **kwargs):
        kwargs['user_id'] = user_id
        return await original_email_execute(*args, **kwargs)
    
    async def calendar_with_context(*args, **kwargs):
        kwargs['user_id'] = user_id
        return await original_calendar_execute(*args, **kwargs)
    
    async def github_with_context(*args, **kwargs):
        kwargs['user_id'] = user_id
        return await original_github_execute(*args, **kwargs)
    
    agent.tools[0].execute = email_with_context
    agent.tools[1].execute = calendar_with_context
    agent.tools[2].execute = github_with_context

    session = AgentSession(
        stt="deepgram",
        llm="google",
        tts="cartesia",
        vad=silero.VAD.load(),
    )

    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(),
    )

    # Greet the user
    greeting = "Hey, I'm Otto. What do you need to know?"
    await session.generate_reply(instructions=f"Say: {greeting}")


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
