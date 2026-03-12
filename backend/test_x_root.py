import os
import tweepy
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

try:
    client = tweepy.Client(
        consumer_key=os.getenv("X_API_KEY"),
        consumer_secret=os.getenv("X_API_SECRET"),
        access_token=os.getenv("X_ACCESS_TOKEN"),
        access_token_secret=os.getenv("X_ACCESS_SECRET")
    )
    
    msg = "【テスト】Root URLのカード検証\n\nhttps://rich-investor-news.com/\n\n#日本株"
    client.create_tweet(text=msg)
    print("Tweet sent.")
except Exception as e:
    print(f"Error: {e}")
