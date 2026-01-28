import os
import tweepy
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def post_to_x(message, media_path=None):
    """
    Post a message to X (formerly Twitter).
    Args:
        message (str): The text content of the tweet.
        media_path (str, optional): Path to a media file (image) to upload.
    Returns:
        str: The Tweet ID if successful, None otherwise.
    """
    api_key = os.getenv("X_API_KEY")
    api_secret = os.getenv("X_API_SECRET")
    access_token = os.getenv("X_ACCESS_TOKEN")
    access_secret = os.getenv("X_ACCESS_SECRET")

    if not all([api_key, api_secret, access_token, access_secret]):
        logger.error("Missing X API credentials")
        return None

    try:
        # V2 Client for Posting Tweet
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret
        )
        
        media_ids = []
        if media_path:
            # V1.1 API for Media Upload
            auth = tweepy.OAuth1UserHandler(
                api_key, api_secret, access_token, access_secret
            )
            api = tweepy.API(auth)
            
            logger.info(f"Uploading media: {media_path}")
            media = api.media_upload(filename=media_path)
            media_ids = [media.media_id]
            logger.info(f"Media uploaded. ID: {media.media_id}")

        if media_ids:
            response = client.create_tweet(text=message, media_ids=media_ids)
        else:
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
