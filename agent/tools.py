"""
Otto Voice Agent - Function Tools
Direct API access via Supabase + external APIs (no HTTP hop through Next.js)
Supports parallel pre-fetching on session start.
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional
from livekit.agents import function_tool, RunContext
from duckduckgo_search import DDGS
from ttc_compression import compress_text
from contacts import resolve_contact
from api_clients import (
    fetch_emails,
    fetch_calendar_events,
    fetch_github_activity,
    create_calendar_event_direct,
    send_email_direct,
)

logging.basicConfig(
    level=logging.INFO,
    format='\033[36m%(asctime)s\033[0m | \033[33m%(levelname)s\033[0m | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("otto.tools")

_current_user_id: Optional[str] = None

# Pre-fetched data cache (populated on session start via parallel fetch)
_prefetched: dict = {}


def set_current_user_id(user_id: str):
    global _current_user_id
    _current_user_id = user_id
    print(f"\033[1;33m🔐 User context set: {user_id}\033[0m")


async def prefetch_user_data():
    """
    Parallel pre-fetch all data sources on session start.
    Data is cached in memory so the first user query is instant.
    """
    global _prefetched
    if not _current_user_id:
        return

    print("\033[1;34m⚡ Pre-fetching user data in parallel...\033[0m")

    try:
        github, gmail, calendar = await asyncio.gather(
            fetch_github_activity(_current_user_id, days_back=1),
            fetch_emails(_current_user_id, max_count=5),
            fetch_calendar_events(_current_user_id, days_ahead=1),
            return_exceptions=True,
        )

        _prefetched["github"] = github if not isinstance(github, Exception) else {}
        _prefetched["gmail"] = gmail if not isinstance(gmail, Exception) else {}
        _prefetched["calendar"] = calendar if not isinstance(calendar, Exception) else {}

        print(f"\033[1;34m⚡ Pre-fetch complete: "
              f"github={'ok' if not isinstance(github, Exception) else 'err'}, "
              f"gmail={'ok' if not isinstance(gmail, Exception) else 'err'}, "
              f"calendar={'ok' if not isinstance(calendar, Exception) else 'err'}\033[0m")
    except Exception as e:
        logger.error(f"Pre-fetch error: {e}")


def _log_tool(name: str, **kwargs):
    args = ", ".join(f"{k}={v!r}" for k, v in kwargs.items() if v is not None)
    print(f"\n\033[1;35m🔧 TOOL CALL:\033[0m \033[1;32m{name}\033[0m({args})")


def _log_result(name: str, result: str):
    display = result[:200] + "..." if len(result) > 200 else result
    print(f"\033[1;35m📤 RESULT:\033[0m {display}\n")


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
    _log_tool("get_github_activity", repo_name=repo_name, days_back=days_back)

    # Check pre-fetched data first (if no specific repo and days_back=1)
    if not repo_name and days_back == 1 and "github" in _prefetched:
        data = _prefetched.pop("github")  # Use once, then clear
        if "events" in data and data["events"]:
            result = _format_github_events(data["events"])
            _log_result("get_github_activity", result)
            return result

    try:
        data = await fetch_github_activity(_current_user_id, repo_name, days_back)

        if "error" in data:
            return data["error"]

        events = data.get("events", [])
        if not events:
            return "No GitHub activity found for the specified period."

        result = _format_github_events(events)
        final = await compress_text(result) if len(result) > 500 else result
        _log_result("get_github_activity", final)
        return final
    except Exception as e:
        logger.error(f"GitHub error: {e}")
        return "There was an error connecting to GitHub."


def _format_github_events(events: list) -> str:
    summaries = []
    commits = [e for e in events if e.get("event_type") == "commit"]
    prs = [e for e in events if e.get("event_type") == "pull_request"]

    if commits:
        summaries.append(f"{len(commits)} commits")
        for c in commits[:5]:
            summaries.append(f"  - {c.get('actor', 'Someone')}: {c.get('title', 'made changes')}")
    if prs:
        summaries.append(f"{len(prs)} pull requests")
        for pr in prs[:3]:
            summaries.append(f"  - {pr.get('actor', 'Someone')}: {pr.get('title', 'opened a PR')}")

    return "\n".join(summaries) if summaries else "No activity found."


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
    _log_tool("get_unread_emails", max_count=max_count)

    # Check pre-fetched data
    if max_count <= 5 and "gmail" in _prefetched:
        data = _prefetched.pop("gmail")
        if "emails" in data and data["emails"]:
            result = _format_emails(data["emails"][:max_count])
            _log_result("get_unread_emails", result)
            return result

    try:
        data = await fetch_emails(_current_user_id, max_count)

        if "error" in data:
            return data["error"] if "not connected" in data.get("error", "") else "I couldn't fetch emails right now."

        emails = data.get("emails", [])
        if not emails:
            return "No unread emails found. Your inbox is clear!"

        return _format_emails(emails[:max_count])
    except Exception as e:
        logger.error(f"Email error: {e}")
        return "There was an error connecting to Gmail."


def _format_emails(emails: list) -> str:
    summaries = [f"You have {len(emails)} recent emails:"]
    for i, email in enumerate(emails, 1):
        summaries.append(f"  {i}. From {email.get('from', 'Unknown')}: {email.get('subject', 'No subject')}")
    return "\n".join(summaries)


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
    _log_tool("get_calendar_events", days_ahead=days_ahead)

    # Check pre-fetched data
    if days_ahead == 1 and "calendar" in _prefetched:
        data = _prefetched.pop("calendar")
        if "events" in data:
            result = _format_calendar(data["events"])
            _log_result("get_calendar_events", result)
            return result

    try:
        data = await fetch_calendar_events(_current_user_id, days_ahead)

        if "error" in data:
            return data["error"] if "not connected" in data.get("error", "") else "I couldn't fetch your calendar right now."

        events = data.get("events", [])
        if not events:
            return "No meetings scheduled. Your calendar is clear!"

        return _format_calendar(events)
    except Exception as e:
        logger.error(f"Calendar error: {e}")
        return "There was an error connecting to Google Calendar."


def _format_calendar(events: list) -> str:
    summaries = [f"You have {len(events)} upcoming meetings:"]
    for event in events:
        summaries.append(f"  - {event.get('title', 'Untitled')} at {event.get('time', '')}")
    return "\n".join(summaries)


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
    _log_tool("create_calendar_event", title=title, date=date, time=time)

    # Parse date
    event_date = _parse_date(date)
    event_time = _parse_time(time)

    try:
        start_dt = datetime.strptime(f"{event_date}T{event_time}:00", "%Y-%m-%dT%H:%M:%S")
        end_dt = start_dt + timedelta(minutes=duration_minutes)

        attendee_list = [a.strip() for a in attendees.split(",")] if attendees else None

        result = await create_calendar_event_direct(
            _current_user_id,
            title,
            start_dt.isoformat(),
            end_dt.isoformat(),
            attendee_list,
        )

        if "error" in result:
            return result["error"]

        msg = f"Done! I've scheduled '{title}' for {event_date} at {event_time}."
        _log_result("create_calendar_event", msg)
        return msg
    except Exception as e:
        logger.error(f"Calendar create error: {e}")
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
    If the recipient is a known contact name (e.g. "Abdullah"), it will be
    automatically resolved to their saved email address.
    Args:
        to: Recipient email address or known contact name
        subject: Email subject line
        body: Email body content
    """
    resolved_to = to
    if "@" not in to:
        resolved_email = resolve_contact(to)
        if resolved_email:
            print(f"\033[1;33m📇 Contact resolved: '{to}' → {resolved_email}\033[0m")
            resolved_to = resolved_email
        else:
            return f"I don't have a saved email for '{to}'. Could you give me their email address?"

    _log_tool("send_email", to=resolved_to, subject=subject)

    try:
        result = await send_email_direct(_current_user_id, resolved_to, subject, body)

        if "error" in result:
            return result["error"]

        msg = f"Done! Email sent to {resolved_to}."
        _log_result("send_email", msg)
        return msg
    except Exception as e:
        logger.error(f"Send email error: {e}")
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
    _log_tool("search_web", query=query)
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))

            if not results:
                return "I couldn't find any results for that query."

            summaries = ["Here's what I found:"]
            for i, r in enumerate(results, 1):
                summaries.append(f"  {i}. {r.get('title', '')}: {r.get('body', '')[:200]}")

            result = "\n".join(summaries)
            final = await compress_text(result) if len(result) > 500 else result
            _log_result("search_web", final)
            return final
    except Exception as e:
        logger.error(f"Search error: {e}")
        return "There was an error searching the web."


@function_tool()
async def lookup_contact(
    context: RunContext,
    name: str
) -> str:
    """
    Look up a known contact's email address by their name.
    Args:
        name: The contact name to look up (e.g., "Abdullah")
    """
    _log_tool("lookup_contact", name=name)
    email = resolve_contact(name)
    if email:
        result = f"{name}'s email is {email}"
        _log_result("lookup_contact", result)
        return result
    else:
        return f"I don't have a saved contact for '{name}'."


# ── Date/Time Parsing Helpers ────────────────────────────────────────

def _parse_date(date: str) -> str:
    date_lower = date.lower().strip()

    if date_lower == "today":
        return datetime.now().strftime("%Y-%m-%d")
    if date_lower == "tomorrow":
        return (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    if date_lower == "next week":
        return (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

    days_of_week = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    if date_lower in days_of_week:
        target = days_of_week.index(date_lower)
        current = datetime.now().weekday()
        delta = target - current
        if delta <= 0:
            delta += 7
        return (datetime.now() + timedelta(days=delta)).strftime("%Y-%m-%d")

    # Try standard formats
    clean = date_lower.replace("st", "").replace("nd", "").replace("rd", "").replace("th", "").strip()
    for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y", "%B %d", "%b %d", "%b. %d"]:
        for attempt in [date, clean]:
            try:
                parsed = datetime.strptime(attempt, fmt)
                if parsed.year == 1900:
                    parsed = parsed.replace(year=datetime.now().year)
                    if parsed < datetime.now():
                        parsed = parsed.replace(year=datetime.now().year + 1)
                return parsed.strftime("%Y-%m-%d")
            except ValueError:
                continue

    return date  # Return as-is if unparseable


def _parse_time(time: str) -> str:
    time_lower = time.lower().strip().replace(" ", "")
    if "pm" in time_lower or "am" in time_lower:
        for fmt in ["%I%p", "%I:%M%p", "%I:00%p"]:
            try:
                return datetime.strptime(time_lower, fmt).strftime("%H:%M")
            except ValueError:
                continue
    return time  # Already HH:MM or unparseable
