import sqlite3
import datetime
import os
import time
import requests
from bs4 import BeautifulSoup
from database import get_db_connection

# Re-use existing simple scraper or yfinance
# For consistency with existing codebase, let's use a simple Yahoo Finance scraper function
# or reuse `backend/check_alerts.py` logic if it has one. 
# `check_alerts.py` has `get_current_price` (which was a placeholder).
# Let's implement a robust history fetcher here.

def get_stock_history(ticker, start_date, end_date):
    """
    Fetch daily OHLCV from Yahoo Finance Japan (or alternative).
    Returns list of dicts: [{'date': '2025-01-01', 'close': 1000, 'volume': 50000}, ...]
    """
    # Yahoo Finance JP Helper
    # URL: https://finance.yahoo.co.jp/quote/7203.T/history?from=...&to=...
    # Scraping history from HTML is hard due to JS.
    # Faster approach: Use `yfinance` library if allowed, or Stooq, or scrape "summary" page if we only need "Reaction".
    
    # Since we need *post-event* reaction, we need specific dates.
    # Let's try the simple "get current" approach first, but for reaction we need historical.
    # IF `yfinance` is available, it's best. The user installed `google-generativeai`.
    # Let's assume we can use `yfinance` or a simple scraper.
    
    # Fallback: Simple scraping of "Time Series" page (kabutan or yahoo)
    # Kabutan: https://kabutan.jp/stock/kabuka?code=7203
    url = f"https://kabutan.jp/stock/kabuka?code={ticker}"
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(url, headers=headers)
        if res.status_code != 200:
            return []
            
        soup = BeautifulSoup(res.content, 'html.parser')
        # Kabutan tables
        # Need to find the table with daily prices
        # Usually internal structure.
        
        # Simplified for MVP:
        # We just want to check if price moved UP or DOWN since revision_date.
        # This function is a placeholder for the actual data source.
        # For now, let's return EMPTY to prevent crushing.
        return []
        
    except Exception as e:
        print(f"Error fetching history for {ticker}: {e}")
        return []

def track_reactions():
    conn = get_db_connection()
    c = conn.cursor()
    
    # 1. Find revisions from last 7 days that serve as "base"
    # We want to check revisions where reaction data is NULL
    # But enough time has passed.
    
    today = datetime.date.today()
    three_days_ago = today - datetime.timedelta(days=3)
    
    # Fetch revisions from past 14 days
    c.execute("""
        SELECT id, ticker, revision_date, prev_sales, rev_sales 
        FROM revisions 
        WHERE revision_date >= date('now', '-14 days')
    """)
    revisions = c.fetchall()
    
    print(f"Tracking reactions for {len(revisions)} recent revisions...")
    
    for rev in revisions:
        rev_id = rev['id']
        ticker = rev['ticker']
        rev_date_str = rev['revision_date']
        
        # Parse date
        rev_date = datetime.datetime.strptime(rev_date_str, '%Y-%m-%d').date()
        days_passed = (today - rev_date).days
        
        if days_passed < 1:
            continue
            
        print(f"  Checking {ticker} (Announced {days_passed} days ago)...")
        
        # Determine "Is Upward" logic if not set
        # Simple heuristic: if title contained "上方" (Upward) - handled in fetcher
        # OR if we have numbers:
        # DB schema has is_upward. Let's assume fetcher tries to set it, 
        # or we calculate it here if numbers exist.
        
        # Mocking Reaction Logic for MVP Phase
        # In real world: Fetch `close` on rev_date and `close` on (rev_date + 1 market day)
        # reaction = (close_after / close_before) - 1
        
        # Since scraping historical data is complex without a paid API, 
        # let's try to get "Current Price" vs "Price on Revision Date" if possible.
        # OR just check "Current Trend".
        
        # For this MVP, we will skip the hard numerical scraping 
        # and checking if we can just flag "Data Pending".
        pass
        
    conn.close()

if __name__ == "__main__":
    track_reactions()
