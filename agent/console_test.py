"""
Otto Console Mode - Test the agent via text input (no microphone needed)
Run with: python console_test.py
"""

import asyncio
import os
import sys
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

# Mock RunContext for testing
class MockRunContext:
    pass

async def main():
    """Interactive console to test Otto's tools"""
    from tools import (
        get_github_activity,
        get_unread_emails,
        get_calendar_events,
        create_calendar_event,
        send_email,
        search_web,
        log_tool_call,
        log_tool_result,
    )
    
    print("\n" + "=" * 60)
    print("🤖 OTTO CONSOLE MODE")
    print("=" * 60)
    print("Test Otto's tools by typing commands.")
    print("Type 'quit' to exit.\n")
    print("Available commands:")
    print("  github [repo]      - Get GitHub activity")
    print("  emails             - Get unread emails")
    print("  calendar           - Get today's calendar")
    print("  schedule <title> <date> <time>  - Create event")
    print("  search <query>     - Web search")
    print("  test-dates         - Test date parsing")
    print("=" * 60 + "\n")
    
    ctx = MockRunContext()
    
    while True:
        try:
            user_input = input("\033[1;36mYou:\033[0m ").strip()
            
            if not user_input:
                continue
                
            if user_input.lower() == 'quit':
                print("\n👋 Goodbye!")
                break
            
            parts = user_input.split()
            command = parts[0].lower()
            
            print()  # Empty line for readability
            
            if command == 'github':
                repo = parts[1] if len(parts) > 1 else None
                # Call the function directly since it's decorated
                result = await get_github_activity.__wrapped__(ctx, repo_name=repo, days_back=1)
                print(f"\033[1;32mOtto:\033[0m {result}")
                
            elif command == 'emails':
                result = await get_unread_emails.__wrapped__(ctx, max_count=5)
                print(f"\033[1;32mOtto:\033[0m {result}")
                
            elif command == 'calendar':
                result = await get_calendar_events.__wrapped__(ctx, days_ahead=1)
                print(f"\033[1;32mOtto:\033[0m {result}")
                
            elif command == 'schedule':
                if len(parts) < 4:
                    print("\033[1;31mUsage:\033[0m schedule <title> <date> <time>")
                    print("Example: schedule Meeting tomorrow 3pm")
                else:
                    title = parts[1]
                    date = parts[2]
                    time = parts[3]
                    result = await create_calendar_event.__wrapped__(
                        ctx, title=title, date=date, time=time
                    )
                    print(f"\033[1;32mOtto:\033[0m {result}")
                    
            elif command == 'search':
                query = " ".join(parts[1:]) if len(parts) > 1 else "test"
                result = await search_web.__wrapped__(ctx, query=query)
                print(f"\033[1;32mOtto:\033[0m {result}")
                
            elif command == 'test-dates':
                from datetime import timedelta
                test_cases = [
                    "today", "tomorrow", "January 28th", 
                    "Feb 15", "September 28", "next week"
                ]
                print("Date parsing results:")
                for date_str in test_cases:
                    date_lower = date_str.lower().strip()
                    if date_lower == "today":
                        result = datetime.now().strftime("%Y-%m-%d")
                    elif date_lower == "tomorrow":
                        result = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
                    elif date_lower == "next week":
                        result = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
                    else:
                        clean = date_lower.replace("st","").replace("nd","").replace("rd","").replace("th","")
                        try:
                            parsed = datetime.strptime(clean, "%B %d")
                            parsed = parsed.replace(year=datetime.now().year)
                            result = parsed.strftime("%Y-%m-%d")
                        except:
                            try:
                                parsed = datetime.strptime(clean, "%b %d")
                                parsed = parsed.replace(year=datetime.now().year)
                                result = parsed.strftime("%Y-%m-%d")
                            except:
                                result = date_str
                    print(f"  {date_str:20} → {result}")
            else:
                print(f"\033[1;33mUnknown command:\033[0m {command}")
                print("Try: github, emails, calendar, schedule, search, test-dates")
            
            print()  # Empty line after response
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\033[1;31mError:\033[0m {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
