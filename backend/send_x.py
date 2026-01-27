import os
import tweepy
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def post_to_x(message):
    """
    Post a message to X (formerly Twitter).
    Returns the Tweet ID if successful, None otherwise.
    """
    api_key = os.getenv("X_API_KEY")
    api_secret = os.getenv("X_API_SECRET")
    access_token = os.getenv("X_ACCESS_TOKEN")
    access_secret = os.getenv("X_ACCESS_SECRET")

    if not all([api_key, api_secret, access_token, access_secret]):
        logger.error("Missing X API credentials")
        return None

    try:
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret
        )
        
        response = client.create_tweet(text=message)
        tweet_id = response.data['id']
        logger.info(f"✅ Posted to X: {tweet_id}")
        return tweet_id
        
    except Exception as e:
        logger.error(f"❌ Failed to post to X: {e}")
        return None

if __name__ == "__main__":
    # Test run
    # post_to_x("Setting up production X bot utility... #InvestorNews")
    pass
