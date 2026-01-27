import tweepy

# Hardcoded keys from User Chat (Text Paste)
API_KEY = "ATbbzVYfqfezKryamEnMt5LO3"
API_SECRET = "FrjOszR7o4H5SFnl5ilJz7AsqNuorGvjJRwnO55Dx5mEfd7gNw"
ACCESS_TOKEN = "1189819570426527745-mKLKXFaaK49sWMfl5iziYS0WxrjzAe"
ACCESS_SECRET = "B4TQUeH3TygaD0jICo9JSViT5gg4WNnRQsw0PDzncTfdF"

print("Testing with HARDCODED keys (Text Paste)...")
print(f"Key: {API_KEY[:5]}...")

try:
    client = tweepy.Client(
        consumer_key=API_KEY,
        consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_SECRET
    )
    
    response = client.create_tweet(text="Text Paste Test #InvestorNews")
    print(f"✅ Posted! ID: {response.data['id']}")
    
except Exception as e:
    print(f"❌ Failed: {e}")
