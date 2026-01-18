
import asyncio
import httpx
import os
from dotenv import load_dotenv

async def test_backend():
    load_dotenv(".env.local")
    
    api_url = "http://localhost:3000"
    user_id = "test-user-id" # We won't have a real token for this, but we can check if it returns 401 (connected: false) vs other errors
    
    headers = {
        "X-User-ID": user_id,
        "Content-Type": "application/json"
    }
    
    endpoints = [
        "/api/gmail?limit=1",
        "/api/calendar?timeframe=today",
        "/api/github?action=events&days=1"
    ]
    
    print(f"🔍 Testing Backend APIs at {api_url}...")
    
    async with httpx.AsyncClient() as client:
        for ep in endpoints:
            try:
                print(f"\n📡 Testing {ep}...")
                resp = await client.get(f"{api_url}{ep}", headers=headers, timeout=5.0)
                print(f"  Status: {resp.status_code}")
                if resp.status_code == 200:
                    data = resp.json()
                    print(f"  Result: Success (Found {len(data.get('events', data.get('messages', [])))} items)")
                elif resp.status_code == 401:
                    print(f"  Result: Unauthorized (Expected if no token is in DB for {user_id})")
                else:
                    print(f"  Result: Warning! {resp.text[:100]}")
            except Exception as e:
                print(f"  ❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_backend())
