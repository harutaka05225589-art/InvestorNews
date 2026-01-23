import requests
import os
import json
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# User provided token
LINE_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")

def send_line_message(message):
    """
    Broadcasts a message to all followers (if paid plan or specific user logic implemented).
    For MVP with free LINE bot, 'broadcast' might be limited.
    Better path: Push to specific user ID (user_id needed).
    
    If 'broadcast' is not allowed on free tier, we can only Reply.
    But for "Self-Notification" (User is the Admin), we can use the User ID of the admin.
    
    Assumption: The user wants to receive alerts themselves OR it's a service for others.
    If it's a service, users must 'Add Friend'.
    
    Simple Broadcast (Check quota):
    https://api.line.me/v2/bot/message/broadcast
    """
    
    url = "https://api.line.me/v2/bot/message/broadcast"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LINE_ACCESS_TOKEN}"
    }
    data = {
        "messages": [
            {
                "type": "text",
                "text": message
            }
        ]
    }
    
    try:
        res = requests.post(url, headers=headers, data=json.dumps(data))
        if res.status_code == 200:
            print("LINE Message sent!")
        else:
            print(f"Failed to send LINE: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Error sending LINE: {e}")

if __name__ == "__main__":
    # Test
    if not LINE_ACCESS_TOKEN:
        print("Error: LINE_CHANNEL_ACCESS_TOKEN not set.")
    else:
        send_line_message("テスト送信: 金持ち投資家ニュースからの通知です。")
