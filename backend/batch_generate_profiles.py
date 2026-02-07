import sqlite3
import time
from database import get_db_connection
from fetch_company_profile import get_or_create_profile

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
        
        # This function handles the "check DB first" logic
        get_or_create_profile(ticker, company_name)
        
        # Sleep to avoid hitting API rate limits (Gemini free tier has limits)
        time.sleep(4) 

if __name__ == "__main__":
    batch_generate_profiles()
