import sqlite3
import time
from database import get_db_connection
from fetch_company_profile import get_or_create_profile
from fetch_financial_stats import fetch_financial_stats, save_financial_stats

def batch_generate_profiles():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get all tickers from revisions (active companies)
    # limit to recent ones or all? Let's try all but unique.
    tickers = c.execute("""
        SELECT DISTINCT ticker, company_name 
        FROM revisions 
        ORDER BY revision_date DESC
    """).fetchall()
    
    conn.close()
    
    print(f"Found {len(tickers)} companies to process.")
    
    for i, row in enumerate(tickers):
        ticker = row['ticker']
        company_name = row['company_name']
        
        print(f"[{i+1}/{len(tickers)}] Checking {company_name} ({ticker})...")
        
        # 1. Profile
        try:
            get_or_create_profile(ticker, company_name)
        except Exception as e:
            print(f"  Profile Error: {e}")

        # 2. Financial Stats (New)
        try:
            # Check if stats exist first to avoid scraping every time (Optional optimization)
            # For now, just fetch.
            stats = fetch_financial_stats(ticker)
            save_financial_stats(stats)
        except Exception as e:
            print(f"  Finance Stats Error: {e}")
        
        # Sleep to avoid hitting API rate limits (Gemini) AND Scraping limits
        time.sleep(4) 

if __name__ == "__main__":
    batch_generate_profiles()
