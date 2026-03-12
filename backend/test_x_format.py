import os
import tweepy
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

api_key = os.getenv("X_API_KEY")
api_secret = os.getenv("X_API_SECRET")
access_token = os.getenv("X_ACCESS_TOKEN")
access_secret = os.getenv("X_ACCESS_SECRET")

try:
    client = tweepy.Client(
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token,
        access_token_secret=access_secret
    )
    
    # Send a tweet with a trailing newline after the URL to ensure OGP validates
    detail_url = "https://rich-investor-news.com/revisions/24329"
    message = f"【テスト配信】Twitter Card の表示テスト\n\n👇 詳細・PDFはこちら\n{detail_url}\n\n#日本株 #投資"
    
    response = client.create_tweet(text=message)
    print(f"✅ Posted test tweet successfully! ID: {response.data['id']}")
    
except Exception as e:
    print(f"❌ Failed to post tweet: {e}")
