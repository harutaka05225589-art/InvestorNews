import sqlite3
import datetime

conn = sqlite3.connect('frontend/investor_news.db')
c = conn.cursor()

target_date = "2026-02-13"

# 1. Get ANOTHER valid ticker for tomorrow (offset 1)
events = c.execute("SELECT ticker, company_name FROM ir_events WHERE event_date = ? LIMIT 1 OFFSET 1", (target_date,)).fetchone()

if not events:
    print(f"No more events found for {target_date}!")
else:
    valid_ticker = events[0]
    company_name = events[1]
    print(f"Found 2nd valid ticker for tomorrow: {valid_ticker} ({company_name})")
    
    # 2. Register for User (MockUser ID=1)
    user_id = 1
    print(f"Registering {valid_ticker} for MockUser (ID: {user_id})...")
    
    # Check exist
    existing = c.execute("SELECT id FROM portfolio_transactions WHERE user_id = ? AND ticker = ?", (user_id, valid_ticker)).fetchone()
    if not existing:
            c.execute("""
            INSERT INTO portfolio_transactions (user_id, ticker, shares, price, transaction_date, account_type)
            VALUES (?, ?, 100, 1000, ?, 'general')
        """, (user_id, valid_ticker, datetime.date.today().strftime('%Y-%m-%d')))
            conn.commit()
            print("Registered successfully.")
    else:
        print("User already registered.")

conn.close()
