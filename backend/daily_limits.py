"""
Shared daily limit tracking for API calls and X (Twitter) tweets.
Uses JSON files to track counts per day. Resets automatically at midnight.
"""
import os
import json
import datetime

_DIR = os.path.dirname(os.path.abspath(__file__))

def _get_counter(counter_file):
    """Get today's count from a counter file. Returns 0 if file doesn't exist or is from a previous day."""
    today = datetime.date.today().isoformat()
    path = os.path.join(_DIR, counter_file)
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                data = json.load(f)
            if data.get('date') == today:
                return data.get('count', 0)
        except:
            pass
    return 0

def _increment(counter_file):
    """Increment today's count and return the new value."""
    today = datetime.date.today().isoformat()
    count = _get_counter(counter_file) + 1
    path = os.path.join(_DIR, counter_file)
    with open(path, 'w') as f:
        json.dump({'date': today, 'count': count}, f)
    return count

# ============================================================
# Gemini API Call Limits (per day)
# ============================================================
API_DAILY_LIMIT = 100
_API_COUNTER_FILE = '.daily_api_count.json'

def get_api_call_count():
    """Get the number of Gemini API calls made today."""
    return _get_counter(_API_COUNTER_FILE)

def can_call_api():
    """Check if we can make another API call today."""
    return get_api_call_count() < API_DAILY_LIMIT

def increment_api_calls():
    """Record an API call. Returns the new total for today."""
    return _increment(_API_COUNTER_FILE)

def remaining_api_calls():
    """How many API calls are left today."""
    return max(0, API_DAILY_LIMIT - get_api_call_count())

# ============================================================
# X (Twitter) Tweet Limits (per day)
# Covers ALL tweet types: alerts, promos, rankings, etc.
# ============================================================
TWEET_DAILY_LIMIT = 7
_TWEET_COUNTER_FILE = '.daily_tweet_count.json'

def get_tweet_count():
    """Get the number of tweets posted today."""
    return _get_counter(_TWEET_COUNTER_FILE)

def can_tweet():
    """Check if we can post another tweet today."""
    return get_tweet_count() < TWEET_DAILY_LIMIT

def increment_tweets():
    """Record a tweet. Returns the new total for today."""
    return _increment(_TWEET_COUNTER_FILE)

def remaining_tweets():
    """How many tweets are left today."""
    return max(0, TWEET_DAILY_LIMIT - get_tweet_count())
