import tweepy

# Hardcoded keys from User Chat
API_KEY = "Ob2ds5kejFj90xkMG3RqUoAlB"
API_SECRET = "Q9GNTZTxotwZPZ3ierZ7vl805DUdAJqemhxcopefM1QLRDkzuD"
ACCESS_TOKEN = "1189819570426527745-6MVMpgxOchtYNaTtswVHUBnun0Qg9Q"
ACCESS_SECRET = "iQEik9ibroLMUTjYGRTTu2QNjx7LoV2sGGAqSq7yLnAFe"

print("Testing with HARDCODED keys...")
print(f"Key: {API_KEY[:5]}...")

try:
    client = tweepy.Client(
        consumer_key=API_KEY,
        consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_SECRET
    )
    
    response = client.create_tweet(text="Hardcode Test #InvestorNews")
    print(f"✅ Posted! ID: {response.data['id']}")
    
except Exception as e:
    print(f"❌ Failed: {e}")
