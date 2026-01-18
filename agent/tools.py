"""
Otto Voice Agent - Function Tools
These tools connect to the Next.js API to fetch user data
"""

import os
import logging
import httpx
from datetime import datetime, timedelta
from typing import Optional
from livekit.agents import function_tool, RunContext
from duckduckgo_search import DDGS
from ttc_compression import compress_text

# Configure logging for console output
logging.basicConfig(
    level=logging.INFO,
    format='\033[36m%(asctime)s\033[0m | \033[33m%(levelname)s\033[0m | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("otto.tools")

def log_tool_call(tool_name: str, **kwargs):
    """Log tool calls with formatted output"""
    args_str = ", ".join(f"{k}={v!r}" for k, v in kwargs.items() if v is not None)
    print(f"\n\033[1;35m🔧 TOOL CALL:\033[0m \033[1;32m{tool_name}\033[0m({args_str})")

def log_tool_result(tool_name: str, result: str):
    """Log tool results with formatted output"""
    # Truncate long results for readability
    display_result = result[:200] + "..." if len(result) > 200 else result
    print(f"\033[1;35m📤 RESULT:\033[0m {display_result}\n")

# API base URL - connects to the Next.js app
API_URL = os.getenv("API_URL", "http://localhost:3000")

# Current user ID (set by main.py when participant connects)
_current_user_id: Optional[str] = None


def set_current_user_id(user_id: str):
    """Set the current user ID for API calls"""
    global _current_user_id
    _current_user_id = user_id
    print(f"\033[1;33m🔐 User context set: {user_id}\033[0m")


def get_api_headers() -> dict:
    """Get headers for API calls, including user authentication"""
    headers = {"Content-Type": "application/json"}
    if _current_user_id:
        headers["X-User-ID"] = _current_user_id
    return headers


@function_tool()
async def get_github_activity(
    context: RunContext,
    repo_name: Optional[str] = None,
    days_back: int = 1
) -> str:
    """
    Get recent GitHub activity including commits, pull requests, and issues.
    
    Args:
        repo_name: Optional repository name (e.g., "otto"). If not provided, uses default repo.
        days_back: Number of days to look back (default: 1 for yesterday)
    """
    log_tool_call("get_github_activity", repo_name=repo_name, days_back=days_back)
    try:
        async with httpx.AsyncClient() as client:
            params = {"action": "events"}  # Use events endpoint
            if repo_name:
                params["repo"] = repo_name
            if days_back:
                params["days"] = days_back
                
            response = await client.get(
                f"{API_URL}/api/github",
                params=params,
                headers=get_api_headers(),
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                events = data.get("events", [])
                
                if not events:
                    return "No GitHub activity found for the specified period."
                
                # Format for voice
                summaries = []
                commits = [e for e in events if e.get("event_type") == "commit"]
                prs = [e for e in events if e.get("event_type") == "pull_request"]
                
                if commits:
                    summaries.append(f"{len(commits)} commits")
                    for c in commits[:5]:
                        actor = c.get("actor", "Someone")
                        title = c.get("title", "made changes")
                        summaries.append(f"  - {actor}: {title}")
                        
                if prs:
                    summaries.append(f"{len(prs)} open pull requests")
                    for pr in prs[:3]:
                        actor = pr.get("actor", "Someone")
                        title = pr.get("title", "opened a PR")
                        summaries.append(f"  - {actor}: {title}")
                
                result = "\n".join(summaries)
                # Compress if large
                final_result = await compress_text(result) if len(result) > 500 else result
                log_tool_result("get_github_activity", final_result)
                return final_result
            else:
                logging.error(f"GitHub API error: {response.status_code}")
                result = "I couldn't fetch GitHub activity right now."
                log_tool_result("get_github_activity", result)
                return result
                
    except Exception as e:
        logging.error(f"Error fetching GitHub activity: {e}")
        return "There was an error connecting to GitHub."


@function_tool()
async def get_unread_emails(
    context: RunContext,
    max_count: int = 5
) -> str:
    """
    Get recent unread or important emails from Gmail.
    
    Args:
        max_count: Maximum number of emails to return (default: 5)
    """
    log_tool_call("get_unread_emails", max_count=max_count)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{API_URL}/api/gmail",
                params={"limit": max_count},
                headers=get_api_headers(),
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                emails = data.get("events", [])
                
                if not emails:
                    return "No unread emails found. Your inbox is clear!"
                
                # Format for voice
                summaries = [f"You have {len(emails)} recent emails:"]
                for i, email in enumerate(emails[:max_count], 1):
                    sender = email.get("actor", "Unknown sender")
                    subject = email.get("title", "No subject")
                    # Clean up sender name
                    if "<" in sender:
                        sender = sender.split("<")[0].strip()
                    summaries.append(f"  {i}. From {sender}: {subject}")
                
                return "\n".join(summaries)
            elif response.status_code == 401:
                return "Gmail is not connected. Please connect it in your dashboard."
            else:
                logging.error(f"Gmail API error: {response.status_code}")
                return "I couldn't fetch emails right now."
                
    except Exception as e:
        logging.error(f"Error fetching emails: {e}")
        return "There was an error connecting to Gmail."


@function_tool()
async def get_calendar_events(
    context: RunContext,
    days_ahead: int = 1
) -> str:
    """
    Get upcoming calendar events/meetings.
    
    Args:
        days_ahead: Number of days ahead to look (default: 1 for today)
    """
    log_tool_call("get_calendar_events", days_ahead=days_ahead)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{API_URL}/api/calendar",
                params={"days": days_ahead},
                headers=get_api_headers(),
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                events = data.get("events", [])
                
                if not events:
                    return "No meetings scheduled for today. Your calendar is clear!"
                
                # Format for voice
                summaries = [f"You have {len(events)} meetings today:"]
                for event in events:
                    title = event.get("title", "Untitled meeting")
                    time = event.get("time", "")
                    summaries.append(f"  - {title} at {time}")
                
                return "\n".join(summaries)
            elif response.status_code == 401:
                return "Google Calendar is not connected. Please connect it in your dashboard."
            else:
                logging.error(f"Calendar API error: {response.status_code}")
                return "I couldn't fetch your calendar right now."
                
    except Exception as e:
        logging.error(f"Error fetching calendar: {e}")
        return "There was an error connecting to Google Calendar."


@function_tool()
async def create_calendar_event(
    context: RunContext,
    title: str,
    date: str,
    time: str,
    duration_minutes: int = 60,
    attendees: Optional[str] = None
) -> str:
    """
    Create a new calendar event/meeting.
    
    Args:
        title: Title of the meeting
        date: Date in format "YYYY-MM-DD" or natural language like "tomorrow"
        time: Time in format "HH:MM" (24-hour) or "3pm"
        duration_minutes: Duration in minutes (default: 60)
        attendees: Comma-separated list of attendee emails (optional)
    """
    log_tool_call("create_calendar_event", title=title, date=date, time=time, duration_minutes=duration_minutes, attendees=attendees)
    try:
        # Parse natural language dates
        event_date = date
        date_lower = date.lower().strip()
        
        if date_lower == "today":
            event_date = datetime.now().strftime("%Y-%m-%d")
        elif date_lower == "tomorrow":
            event_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        elif date_lower in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
            days_of_week = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            target_weekday = days_of_week.index(date_lower)
            current_weekday = datetime.now().weekday()
            days_ahead = target_weekday - current_weekday
            if days_ahead <= 0: # Target day is today or has passed this week
                days_ahead += 7
            event_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
        elif date_lower == "next week":
            event_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        else:
            # Try to parse various date formats
            date_formats = [
                "%Y-%m-%d",           # 2026-01-20
                "%m/%d/%Y",           # 01/20/2026
                "%m-%d-%Y",           # 01-20-2026
                "%B %d",              # January 20
                "%B %dth",            # January 20th
                "%B %dst",            # January 1st
                "%B %dnd",            # January 2nd
                "%B %drd",            # January 3rd
                "%b %d",              # Jan 20
                "%b %dth",            # Jan 20th
                "%b %dst",            # Jan 1st
                "%b %dnd",            # Jan 2nd
                "%b %drd",            # Jan 3rd
                "%b. %d",             # Jan. 20
                "%b. %dth",           # Jan. 20th
            ]
            
            # Clean up the date string - remove ordinal suffixes
            clean_date = date_lower.replace("st", "").replace("nd", "").replace("rd", "").replace("th", "").strip()
            
            parsed_date = None
            for fmt in date_formats:
                # Also try with cleaned date
                for try_date in [date, clean_date]:
                    try:
                        parsed_date = datetime.strptime(try_date, fmt)
                        # If year not in format, use current year
                        if parsed_date.year == 1900:
                            parsed_date = parsed_date.replace(year=datetime.now().year)
                            # If the date has passed, use next year
                            if parsed_date < datetime.now():
                                parsed_date = parsed_date.replace(year=datetime.now().year + 1)
                        event_date = parsed_date.strftime("%Y-%m-%d")
                        break
                    except ValueError:
                        continue
                if parsed_date:
                    break
        
        # Parse time formats
        event_time = time
        time_lower = time.lower().strip().replace(" ", "")
        if "pm" in time_lower or "am" in time_lower:
            # Convert 3pm -> 15:00, 11pm -> 23:00, 3:30pm -> 15:30
            time_formats = [
                "%I%p",      # 3pm
                "%I:%M%p",   # 3:30pm
                "%I:00%p",   # 3:00pm
            ]
            for fmt in time_formats:
                try:
                    parsed = datetime.strptime(time_lower, fmt)
                    event_time = parsed.strftime("%H:%M")
                    break
                except ValueError:
                    continue
        
        async with httpx.AsyncClient() as client:
            payload = {
                "title": title,
                "date": event_date,
                "time": event_time,
                "duration": duration_minutes,
            }
            if attendees:
                payload["attendees"] = [a.strip() for a in attendees.split(",")]
            
            response = await client.post(
                f"{API_URL}/api/calendar",
                json=payload,
                headers=get_api_headers(),
                timeout=10.0
            )
            
            if response.status_code in [200, 201]:
                result = f"Done! I've scheduled '{title}' for {event_date} at {event_time}."
                log_tool_result("create_calendar_event", result)
                return result
            elif response.status_code == 401:
                return "Google Calendar is not connected. Please connect it in your dashboard."
            else:
                logging.error(f"Calendar create error: {response.status_code}")
                return "I couldn't create the event right now."
                
    except Exception as e:
        logging.error(f"Error creating calendar event: {e}")
        return "There was an error creating the calendar event."


@function_tool()
async def send_email(
    context: RunContext,
    to: str,
    subject: str,
    body: str
) -> str:
    """
    Send an email via Gmail.
    
    Args:
        to: Recipient name or email address (e.g., "abdullah" or "test@example.com")
        subject: Email subject line
        body: Email body content
    """
    from contacts import resolve_contact
    
    # Resolve name to email if needed
    recipient_email = resolve_contact(to)
    
    log_tool_call("send_email", to=recipient_email, subject=subject, body=body[:50]+"..." if len(body) > 50 else body)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{API_URL}/api/gmail/send",
                json={
                    "to": recipient_email,
                    "subject": subject,
                    "body": body
                },
                headers=get_api_headers(),
                timeout=10.0
            )
            
            if response.status_code in [200, 201]:
                result = f"Done! Email sent to {recipient_email}."
                log_tool_result("send_email", result)
                return result
            elif response.status_code == 401:
                return "Gmail is not connected. Please connect it in your dashboard."
            else:
                logging.error(f"Gmail send error: {response.status_code}")
                return "I couldn't send the email right now."
                
    except Exception as e:
        logging.error(f"Error sending email: {e}")
        return "There was an error sending the email."


@function_tool()
async def search_web(
    context: RunContext,
    query: str
) -> str:
    """
    Search the web using DuckDuckGo for general questions.
    
    Args:
        query: The search query
    """
    log_tool_call("search_web", query=query)
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
            
            if not results:
                return "I couldn't find any results for that query."
            
            summaries = ["Here's what I found:"]
            for i, r in enumerate(results, 1):
                title = r.get("title", "")
                body = r.get("body", "")[:200]
                summaries.append(f"  {i}. {title}: {body}")
            
            result = "\n".join(summaries)
            # Compress if large
            final_result = await compress_text(result) if len(result) > 500 else result
            log_tool_result("search_web", final_result)
            return final_result
            
    except Exception as e:
        logging.error(f"Error searching web: {e}")
        return "There was an error searching the web."
