from fetch_dividend_history import fetch_dividend_history, save_history
from database import get_db_connection
import time

def batch_process():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get all unique tickers from revisions
    tickers = [row['ticker'] for row in c.execute("SELECT DISTINCT ticker FROM revisions").fetchall()]
    conn.close()
    
    print(f"Found {len(tickers)} unique tickers to process.")
    
    for i, ticker in enumerate(tickers):
        print(f"[{i+1}/{len(tickers)}] Processing {ticker}...")
        hist = fetch_dividend_history(ticker)
        if hist:
            save_history(ticker, hist)
        else:
            print("  No history found.")
        
        time.sleep(1.5) # Be polite

if __name__ == "__main__":
    batch_process()
