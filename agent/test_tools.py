"""
Otto Tools Test Script
Run this to test all 6 tools and save output to test_results.txt
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add the agent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

# Set up API URL
API_URL = os.getenv("API_URL", "http://localhost:3000")

async def test_all_tools():
    """Test all tools and save output to file"""
    import httpx
    from duckduckgo_search import DDGS
    
    results = []
    results.append("=" * 60)
    results.append("OTTO TOOLS TEST RESULTS")
    results.append(f"Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    results.append(f"API_URL: {API_URL}")
    results.append("=" * 60)
    results.append("")
    
    # Test 1: GitHub Activity API
    results.append("-" * 40)
    results.append("TEST 1: GitHub Activity API")
    results.append("-" * 40)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{API_URL}/api/github", timeout=10.0)
            results.append(f"HTTP Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                events = data.get("events", [])
                results.append(f"Events found: {len(events)}")
                for e in events[:3]:
                    results.append(f"  - {e.get('actor')}: {e.get('title', '')[:50]}")
                results.append("Status: SUCCESS ✅")
            elif response.status_code == 401:
                results.append("Status: UNAUTHORIZED (need to log in)")
            else:
                results.append(f"Response: {response.text[:200]}")
    except Exception as e:
        results.append(f"Status: FAILED ❌")
        results.append(f"Error: {str(e)}")
    results.append("")
    
    # Test 2: Gmail API
    results.append("-" * 40)
    results.append("TEST 2: Gmail API")
    results.append("-" * 40)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{API_URL}/api/gmail", timeout=10.0)
            results.append(f"HTTP Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                messages = data.get("messages", [])
                results.append(f"Emails found: {len(messages)}")
                for m in messages[:3]:
                    results.append(f"  - From {m.get('from')}: {m.get('subject', '')[:40]}")
                results.append("Status: SUCCESS ✅")
            elif response.status_code == 401 or response.status_code == 400:
                results.append("Status: UNAUTHORIZED (need to log in)")
            else:
                results.append(f"Response: {response.text[:200]}")
    except Exception as e:
        results.append(f"Status: FAILED ❌")
        results.append(f"Error: {str(e)}")
    results.append("")
    
    # Test 3: Calendar API (GET)
    results.append("-" * 40)
    results.append("TEST 3: Calendar API (GET events)")
    results.append("-" * 40)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{API_URL}/api/calendar", timeout=10.0)
            results.append(f"HTTP Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                events = data.get("events", [])
                results.append(f"Events found: {len(events)}")
                for e in events[:3]:
                    results.append(f"  - {e.get('title')} at {e.get('time')}")
                results.append("Status: SUCCESS ✅")
            elif response.status_code == 401 or response.status_code == 400:
                results.append("Status: UNAUTHORIZED (need to log in)")
            else:
                results.append(f"Response: {response.text[:200]}")
    except Exception as e:
        results.append(f"Status: FAILED ❌")
        results.append(f"Error: {str(e)}")
    results.append("")
    
    # Test 4: Date Parsing Logic
    results.append("-" * 40)
    results.append("TEST 4: Date Parsing Logic")
    results.append("-" * 40)
    test_dates = [
        ("today", datetime.now().strftime("%Y-%m-%d")),
        ("tomorrow", (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")),
        ("January 28th", "2026-01-28"),
        ("Feb 15", "2026-02-15"),
        ("September 28", "2026-09-28"),
    ]
    all_pass = True
    for input_date, expected in test_dates:
        # Parse logic from tools.py
        date_lower = input_date.lower().strip()
        if date_lower == "today":
            parsed = datetime.now().strftime("%Y-%m-%d")
        elif date_lower == "tomorrow":
            parsed = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            clean_date = date_lower.replace("st", "").replace("nd", "").replace("rd", "").replace("th", "").strip()
            try:
                parsed_date = datetime.strptime(clean_date, "%B %d")
                parsed_date = parsed_date.replace(year=2026)
                parsed = parsed_date.strftime("%Y-%m-%d")
            except:
                try:
                    parsed_date = datetime.strptime(clean_date, "%b %d")
                    parsed_date = parsed_date.replace(year=2026)
                    parsed = parsed_date.strftime("%Y-%m-%d")
                except:
                    parsed = input_date
        
        status = "✅" if parsed == expected else "❌"
        if parsed != expected:
            all_pass = False
        results.append(f"  '{input_date}' -> {parsed} (expected: {expected}) {status}")
    
    results.append(f"Status: {'SUCCESS ✅' if all_pass else 'FAILED ❌'}")
    results.append("")
    
    # Test 5: Time Parsing Logic  
    results.append("-" * 40)
    results.append("TEST 5: Time Parsing Logic")
    results.append("-" * 40)
    test_times = [
        ("3pm", "15:00"),
        ("11am", "11:00"),
        ("3:30pm", "15:30"),
        ("9:15am", "09:15"),
        ("11pm", "23:00"),
    ]
    all_pass = True
    for input_time, expected in test_times:
        time_lower = input_time.lower().strip().replace(" ", "")
        parsed = input_time
        if "pm" in time_lower or "am" in time_lower:
            time_formats = ["%I%p", "%I:%M%p", "%I:00%p"]
            for fmt in time_formats:
                try:
                    parsed_time = datetime.strptime(time_lower, fmt)
                    parsed = parsed_time.strftime("%H:%M")
                    break
                except:
                    continue
        
        status = "✅" if parsed == expected else "❌"
        if parsed != expected:
            all_pass = False
        results.append(f"  '{input_time}' -> {parsed} (expected: {expected}) {status}")
    
    results.append(f"Status: {'SUCCESS ✅' if all_pass else 'FAILED ❌'}")
    results.append("")
    
    # Test 6: Web Search (DuckDuckGo)
    results.append("-" * 40)
    results.append("TEST 6: Web Search (DuckDuckGo)")
    results.append("-" * 40)
    try:
        with DDGS() as ddgs:
            search_results = list(ddgs.text("current time", max_results=3))
            results.append(f"Results found: {len(search_results)}")
            for i, r in enumerate(search_results, 1):
                title = r.get("title", "")[:50]
                results.append(f"  {i}. {title}")
            results.append("Status: SUCCESS ✅")
    except Exception as e:
        results.append(f"Status: FAILED ❌")
        results.append(f"Error: {str(e)}")
    results.append("")
    
    # Test 7: Token Company Compression
    results.append("-" * 40)
    results.append("TEST 7: Token Company Compression")
    results.append("-" * 40)
    try:
        from ttc_compression import compress_text, get_client
        client = get_client()
        if client:
            results.append("Token Company client: CONNECTED ✅")
            # Test compression
            test_text = "This is a test of the Token Company compression API. " * 20
            compressed = await compress_text(test_text)
            ratio = len(test_text) / len(compressed) if len(compressed) > 0 else 1
            results.append(f"Original: {len(test_text)} chars")
            results.append(f"Compressed: {len(compressed)} chars")
            results.append(f"Ratio: {ratio:.2f}x")
            results.append("Status: SUCCESS ✅")
        else:
            results.append("Token Company client: NOT CONFIGURED")
            results.append("(Add TTC_API_KEY to .env)")
    except Exception as e:
        results.append(f"Status: FAILED ❌")
        results.append(f"Error: {str(e)}")
    results.append("")
    
    results.append("=" * 60)
    results.append("TEST COMPLETE")
    results.append("=" * 60)
    
    # Save to file
    output_file = os.path.join(os.path.dirname(__file__), "test_results.txt")
    with open(output_file, "w") as f:
        f.write("\n".join(results))
    
    # Also print to console
    print("\n".join(results))
    print(f"\n📄 Results saved to: {output_file}")

if __name__ == "__main__":
    asyncio.run(test_all_tools())
