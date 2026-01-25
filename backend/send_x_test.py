import os
import tweepy
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

def mask_key(k):
    if not k or len(k) < 8: return "MISSING or SHORT"
    return f"{k[:4]}...{k[-4:]}"

def test_post_x():
    print(f"🕒 Server Time: {datetime.now()}")
    print(f"📂 Loading .env from: {dotenv_path}")

    api_key = os.getenv("X_API_KEY")
    api_secret = os.getenv("X_API_SECRET")
    access_token = os.getenv("X_ACCESS_TOKEN")
    access_secret = os.getenv("X_ACCESS_SECRET")

    print(f"🔑 API Key: {mask_key(api_key)} (Len: {len(api_key) if api_key else 0})")
    print(f"🔑 API Sec: {mask_key(api_secret)} (Len: {len(api_secret) if api_secret else 0})")
    print(f"🔑 Token  : {mask_key(access_token)} (Len: {len(access_token) if access_token else 0})")
    print(f"🔑 Tok Sec: {mask_key(access_secret)} (Len: {len(access_secret) if access_secret else 0})")

    # Check for hidden characters
    if api_key and api_key != api_key.strip(): print("⚠️ WARNING: API Key has bad spaces!")
    if api_secret and api_secret != api_secret.strip(): print("⚠️ WARNING: API Secret has bad spaces!")
    if access_token and access_token != access_token.strip(): print("⚠️ WARNING: Token has bad spaces!")
    if access_secret and access_secret != access_secret.strip(): print("⚠️ WARNING: Token Secret has bad spaces!")
    if not api_key or not access_token:
        print("❌ Error: Keys are empty! Check .env formatting (no spaces around =).")
        return

    # --- Test 1: OAuth 1.1 (Verify Credentials) ---
    print("\n📡 Testing v1.1 Authentication...")
    try:
        auth = tweepy.OAuth1UserHandler(api_key, api_secret, access_token, access_secret)
        api = tweepy.API(auth)
        user = api.verify_credentials()
        print(f"✅ v1.1 Success! Logged in as: @{user.screen_name}")
    except Exception as e:
        print(f"❌ v1.1 Failed: {e}")

    # --- Test 2: API v2 (Posting) ---
    print("\n🚀 Testing v2 Posting...")
    try:
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret
        )
        
        message = f"システム接続テスト {int(time.time())}\n#InvestorNews"
        response = client.create_tweet(text=message)
        print(f"✅ v2 Success! Tweet sent. ID: {response.data['id']}")
    except Exception as e:
        print(f"❌ v2 Failed: {e}")

if __name__ == "__main__":
    test_post_x()
