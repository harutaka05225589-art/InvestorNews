
import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

ticker = "2975"
print(f"Checking data for ticker: {ticker}")

# Check Revisions
c.execute("SELECT id, revision_date, dividend_forecast_annual, dividend_rights_month, dividend_payment_month FROM revisions WHERE ticker = ? ORDER BY revision_date DESC", (ticker,))
rows = c.fetchall()

if rows:
    print(f"Found {len(rows)} revision(s) for {ticker}:")
    for r in rows:
        print(r)
else:
    print(f"NO DATA found in 'revisions' table for {ticker}.")
    
    # Check if it exists in ir_events (just to ensure it's a known stock)
    c.execute("SELECT * FROM ir_events WHERE ticker = ?", (ticker,))
    if c.fetchone():
        print("Stock exists in 'ir_events'.")
    else:
        print("Stock NOT found in 'ir_events'.")

conn.close()
