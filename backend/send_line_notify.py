import requests
import os
import sys

def send_line_notify(message, token=None):
    """
    Sends a message via LINE Notify.
    1. Generate token at: https://notify-bot.line.me/my/
    2. Set LINE_NOTIFY_TOKEN in .env or pass as argument
    """
    if not token:
        # Try to load from env if not passed
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
        token = os.getenv("LINE_NOTIFY_TOKEN")
        
    if not token:
        print("Error: No LINE_NOTIFY_TOKEN provided.")
        return False
        
    url = "https://notify-api.line.me/api/notify"
    headers = {"Authorization": f"Bearer {token}"}
    data = {"message": message}
    
    try:
        res = requests.post(url, headers=headers, data=data)
        if res.status_code == 200:
            print("LINE Notify sent successfully!")
            return True
        else:
            print(f"Failed: {res.status_code} {res.text}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # If run with args: python3 send_line_notify.py "Message" "Token"
        msg = sys.argv[1]
        tok = sys.argv[2] if len(sys.argv) > 2 else None
        send_line_notify(msg, tok)
    else:
        print("Usage: python3 send_line_notify.py 'Message' [Token]")
