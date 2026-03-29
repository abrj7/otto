"""
Supabase client for direct database access from the Python agent.
Reads tokens from user_integrations, reads/writes cache tables.
Handles Google token refresh.
"""

import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx

logger = logging.getLogger("otto.supabase")

# Supabase config — loaded from .env.local (project root)
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")


def _headers():
    """Supabase REST API headers using service role key (bypasses RLS)"""
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _rest_url(table: str):
    """PostgREST URL for a table"""
    return f"{SUPABASE_URL}/rest/v1/{table}"


async def get_google_token(user_id: str) -> Optional[str]:
    """
    Get a valid Google access token for a user.
    Auto-refreshes if expired (5-min buffer).
    """
    async with httpx.AsyncClient() as client:
        # Fetch token from user_integrations
        res = await client.get(
            _rest_url("user_integrations"),
            headers=_headers(),
            params={
                "select": "access_token,refresh_token,token_expires_at",
                "user_id": f"eq.{user_id}",
                "provider": "eq.google",
            },
        )

        if res.status_code != 200 or not res.json():
            return None

        integration = res.json()[0]
        access_token = integration.get("access_token")
        refresh_token = integration.get("refresh_token")
        expires_at = integration.get("token_expires_at")

        if not access_token:
            return None

        # Check if expired (5-min buffer)
        if expires_at:
            exp_time = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if exp_time < datetime.now(timezone.utc) + timedelta(minutes=5):
                # Token expired — refresh it
                if not refresh_token:
                    logger.warning("Google token expired, no refresh token")
                    return None

                refreshed = await _refresh_google_token(
                    client, user_id, refresh_token
                )
                return refreshed

        return access_token


async def _refresh_google_token(
    client: httpx.AsyncClient, user_id: str, refresh_token: str
) -> Optional[str]:
    """Refresh an expired Google OAuth token"""
    try:
        res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
            },
        )

        if res.status_code != 200:
            logger.error(f"Token refresh failed: {res.text}")
            return None

        data = res.json()
        new_token = data["access_token"]
        expires_in = data.get("expires_in", 3600)
        expires_at = (
            datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        ).isoformat()

        # Update in database
        await client.patch(
            _rest_url("user_integrations"),
            headers=_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "provider": "eq.google",
            },
            json={
                "access_token": new_token,
                "token_expires_at": expires_at,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        logger.info("Google token refreshed successfully")
        return new_token
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return None


async def get_github_token(user_id: str) -> Optional[str]:
    """Get GitHub access token for a user (no refresh needed)"""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            _rest_url("user_integrations"),
            headers=_headers(),
            params={
                "select": "access_token",
                "user_id": f"eq.{user_id}",
                "provider": "eq.github",
            },
        )

        if res.status_code != 200 or not res.json():
            return None

        return res.json()[0].get("access_token")


async def get_cached_items(
    user_id: str, provider: str, item_type: str, limit: int = 20
) -> list:
    """Read cached items from Supabase"""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            _rest_url("user_cached_items"),
            headers=_headers(),
            params={
                "select": "id,data,updated_at",
                "user_id": f"eq.{user_id}",
                "provider": f"eq.{provider}",
                "item_type": f"eq.{item_type}",
                "order": "updated_at.desc",
                "limit": str(limit),
            },
        )

        if res.status_code != 200:
            return []

        return res.json()


async def get_sync_state(user_id: str, provider: str) -> Optional[dict]:
    """Get sync state for cache freshness check"""
    async with httpx.AsyncClient() as client:
        res = await client.get(
            _rest_url("user_sync_state"),
            headers=_headers(),
            params={
                "select": "sync_token,last_synced_at",
                "user_id": f"eq.{user_id}",
                "provider": f"eq.{provider}",
            },
        )

        if res.status_code != 200 or not res.json():
            return None

        return res.json()[0]
