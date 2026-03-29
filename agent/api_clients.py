"""
Direct API clients for Gmail, Calendar, and GitHub.
Called from tools.py — no more HTTP hop through Next.js.
Reads tokens from Supabase, calls external APIs directly.
Checks cache first to avoid redundant calls.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx

from supabase_client import (
    get_google_token,
    get_github_token,
    get_cached_items,
    get_sync_state,
)

logger = logging.getLogger("otto.api_clients")

# Cache TTLs in seconds
CACHE_TTL = {
    "gmail": 300,      # 5 minutes
    "calendar": 600,   # 10 minutes
    "github": 600,     # 10 minutes
}


def _is_cache_fresh(last_synced_at: str, provider: str) -> bool:
    """Check if cached data is within TTL"""
    synced = datetime.fromisoformat(last_synced_at.replace("Z", "+00:00"))
    age = (datetime.now(timezone.utc) - synced).total_seconds()
    return age < CACHE_TTL.get(provider, 300)


# ── Gmail ────────────────────────────────────────────────────────────

async def fetch_emails(user_id: str, max_count: int = 5) -> dict:
    """
    Get recent emails. Checks Supabase cache first, falls back to Gmail API.
    Returns: { "emails": [...], "source": "cache"|"api" }
    """
    # Check cache
    sync_state = await get_sync_state(user_id, "gmail")
    if sync_state and _is_cache_fresh(sync_state["last_synced_at"], "gmail"):
        cached = await get_cached_items(user_id, "gmail", "email", max_count)
        if cached:
            emails = [item["data"] for item in cached]
            return {"emails": emails[:max_count], "source": "cache"}

    # Cache miss — call Gmail API directly
    token = await get_google_token(user_id)
    if not token:
        return {"error": "Gmail not connected", "emails": []}

    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient(timeout=10.0) as client:
        # List messages — request only IDs and snippet to minimize payload
        list_res = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers=headers,
            params={
                "maxResults": str(max_count),
                "labelIds": "INBOX",
                "fields": "messages(id)",
            },
        )

        if list_res.status_code != 200:
            return {"error": f"Gmail API error: {list_res.status_code}", "emails": []}

        message_ids = [m["id"] for m in list_res.json().get("messages", [])]

        if not message_ids:
            return {"emails": [], "source": "api"}

        # Fetch metadata only (From, Subject, Date) — skip full body for voice
        import asyncio

        async def fetch_message(msg_id: str):
            res = await client.get(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}",
                headers=headers,
                params={
                    "format": "metadata",
                    "metadataHeaders": ["From", "Subject", "Date"],
                    "fields": "id,snippet,labelIds,payload.headers",
                },
            )
            return res.json() if res.status_code == 200 else None

        details = await asyncio.gather(*[fetch_message(mid) for mid in message_ids])

        emails = []
        for msg in details:
            if not msg:
                continue
            hdrs = msg.get("payload", {}).get("headers", [])
            from_val = next((h["value"] for h in hdrs if h["name"] == "From"), "Unknown")
            subject = next((h["value"] for h in hdrs if h["name"] == "Subject"), "(no subject)")

            # Clean sender name
            sender = from_val.split("<")[0].strip().strip('"') if "<" in from_val else from_val

            emails.append({
                "id": msg["id"],
                "from": sender,
                "subject": subject,
                "unread": "UNREAD" in (msg.get("labelIds") or []),
            })

        return {"emails": emails, "source": "api"}


# ── Calendar ─────────────────────────────────────────────────────────

async def fetch_calendar_events(user_id: str, days_ahead: int = 1) -> dict:
    """
    Get upcoming calendar events. Checks cache first.
    Returns: { "events": [...], "source": "cache"|"api" }
    """
    sync_state = await get_sync_state(user_id, "calendar")
    if sync_state and _is_cache_fresh(sync_state["last_synced_at"], "calendar"):
        cached = await get_cached_items(user_id, "calendar", "event", 10)
        if cached:
            now = datetime.now(timezone.utc)
            cutoff = now + timedelta(days=days_ahead)
            events = []
            for item in cached:
                ev = item["data"]
                start = ev.get("start", "")
                try:
                    start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
                    if now <= start_dt <= cutoff:
                        events.append(ev)
                except (ValueError, TypeError):
                    events.append(ev)  # include if we can't parse date
            return {"events": events, "source": "cache"}

    token = await get_google_token(user_id)
    if not token:
        return {"error": "Calendar not connected", "events": []}

    headers = {"Authorization": f"Bearer {token}"}

    now = datetime.now(timezone.utc)
    time_min = now.isoformat()
    time_max = (now + timedelta(days=days_ahead)).isoformat()

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers=headers,
            params={
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": "10",
                "fields": "items(id,summary,start,end,location)",
            },
        )

        if res.status_code != 200:
            return {"error": f"Calendar API error: {res.status_code}", "events": []}

        data = res.json()
        events = []
        for item in data.get("items", []):
            start_dt = item.get("start", {}).get("dateTime") or item.get("start", {}).get("date", "")
            time_str = ""
            if item.get("start", {}).get("dateTime"):
                try:
                    time_str = datetime.fromisoformat(start_dt).strftime("%I:%M %p")
                except (ValueError, TypeError):
                    time_str = start_dt
            else:
                time_str = "All Day"

            events.append({
                "title": item.get("summary", "Untitled"),
                "time": time_str,
                "start": start_dt,
                "location": item.get("location", ""),
            })

        return {"events": events, "source": "api"}


async def create_calendar_event_direct(
    user_id: str, title: str, start_iso: str, end_iso: str, attendees: list[str] | None = None
) -> dict:
    """Create a calendar event directly via Google Calendar API"""
    token = await get_google_token(user_id)
    if not token:
        return {"error": "Calendar not connected"}

    tz = "America/New_York"  # TODO: get from user profile

    payload: dict = {
        "summary": title,
        "start": {"dateTime": start_iso, "timeZone": tz},
        "end": {"dateTime": end_iso, "timeZone": tz},
    }
    if attendees:
        payload["attendees"] = [{"email": e} for e in attendees]

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

        if res.status_code in (200, 201):
            event = res.json()
            return {"success": True, "event_id": event.get("id")}
        else:
            return {"error": f"Calendar create failed: {res.status_code}"}


# ── Gmail Send ───────────────────────────────────────────────────────

async def send_email_direct(user_id: str, to: str, subject: str, body: str) -> dict:
    """Send an email directly via Gmail API"""
    token = await get_google_token(user_id)
    if not token:
        return {"error": "Gmail not connected"}

    import base64

    # RFC 2822 message
    message = f"To: {to}\r\nSubject: {subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n{body}"
    raw = base64.urlsafe_b64encode(message.encode()).decode()

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={"raw": raw},
        )

        if res.status_code in (200, 201):
            return {"success": True}
        else:
            return {"error": f"Gmail send failed: {res.status_code}"}


# ── GitHub ───────────────────────────────────────────────────────────

async def fetch_github_activity(
    user_id: str, repo_name: Optional[str] = None, days_back: int = 1
) -> dict:
    """
    Get GitHub activity. Checks cache for repo list, calls API for fresh commits/PRs.
    Returns: { "events": [...], "source": "cache"|"api" }
    """
    token = await get_github_token(user_id)
    if not token:
        return {"error": "GitHub not connected", "events": []}

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }

    since_date = datetime.now(timezone.utc) - timedelta(days=days_back)
    since_iso = since_date.isoformat()

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Determine repos
        target_repos: list[str] = []

        if repo_name:
            if "/" in repo_name:
                target_repos = [repo_name]
            else:
                # Try to find in cache first
                cached_repos = await get_cached_items(user_id, "github", "repo", 20)
                match = next(
                    (r for r in cached_repos if r["data"].get("name", "").lower() == repo_name.lower()),
                    None,
                )
                if match:
                    target_repos = [match["data"]["fullName"]]
                else:
                    # Single API call to get username
                    user_res = await client.get("https://api.github.com/user", headers=headers)
                    if user_res.status_code == 200:
                        username = user_res.json()["login"]
                        target_repos = [f"{username}/{repo_name}"]
        else:
            # Use cached repos or fetch top 3
            cached_repos = await get_cached_items(user_id, "github", "repo", 3)
            if cached_repos:
                target_repos = [r["data"]["fullName"] for r in cached_repos]
            else:
                repos_res = await client.get(
                    "https://api.github.com/user/repos",
                    headers=headers,
                    params={"sort": "updated", "per_page": "3"},
                )
                if repos_res.status_code == 200:
                    target_repos = [r["full_name"] for r in repos_res.json()]

        # Parallel fetch: commits + PRs per repo (max 3 repos)
        import asyncio

        all_events: list[dict] = []

        async def fetch_repo_events(full_name: str):
            commits_res, prs_res = await asyncio.gather(
                client.get(
                    f"https://api.github.com/repos/{full_name}/commits",
                    headers=headers,
                    params={"since": since_iso, "per_page": "10"},
                ),
                client.get(
                    f"https://api.github.com/repos/{full_name}/pulls",
                    headers=headers,
                    params={"state": "all", "sort": "updated", "direction": "desc", "per_page": "5"},
                ),
            )

            if commits_res.status_code == 200:
                for c in commits_res.json():
                    all_events.append({
                        "event_type": "commit",
                        "actor": c.get("commit", {}).get("author", {}).get("name", "Unknown"),
                        "title": c.get("commit", {}).get("message", "").split("\n")[0],
                        "date": c.get("commit", {}).get("author", {}).get("date", ""),
                        "repo": full_name,
                    })

            if prs_res.status_code == 200:
                for pr in prs_res.json():
                    if datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00")) > since_date:
                        all_events.append({
                            "event_type": "pull_request",
                            "actor": pr.get("user", {}).get("login", "Unknown"),
                            "title": pr.get("title", ""),
                            "date": pr.get("created_at", ""),
                            "state": pr.get("state", ""),
                            "repo": full_name,
                        })

        await asyncio.gather(*[fetch_repo_events(r) for r in target_repos[:3]])

        all_events.sort(key=lambda e: e.get("date", ""), reverse=True)
        return {"events": all_events[:20], "source": "api"}
