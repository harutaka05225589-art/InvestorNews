import os
import tweepy
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def test_post_x():
    api_key = os.getenv("X_API_KEY")
    api_secret = os.getenv("X_API_SECRET")
    access_token = os.getenv("X_ACCESS_TOKEN")
    access_secret = os.getenv("X_ACCESS_SECRET")

    if not all([api_key, api_secret, access_token, access_secret]):
        print("❌ Error: Missing X API credentials in .env")
        return

    try:
        # Authenticate with X API v2
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret
        )

        message = "これは自動投稿のテストです。\n億り人・決算速報システムからの送信 #InvestorNews"
        
        response = client.create_tweet(text=message)
        print("✅ Success! Tweet sent.")
        print(f"Tweet ID: {response.data['id']}")
        
    except Exception as e:
        print(f"❌ Failed to send tweet: {e}")

if __name__ == "__main__":
    test_post_x()
