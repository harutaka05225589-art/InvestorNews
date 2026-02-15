import sqlite3
import datetime

conn = sqlite3.connect('frontend/investor_news.db')
c = conn.cursor()

# Find a user with LINE ID
user = c.execute("SELECT id, nickname, line_user_id FROM users WHERE line_user_id IS NOT NULL LIMIT 1").fetchone()

if not user:
    print("No user with LINE ID found. Cannot simulate.")
else:
    user_id = user[0]
    nickname = user[1]
    line_id = user[2]
    print(f"Found user: {nickname} (ID: {user_id}, LINE: ...{line_id[-4:]})")
    
    # Target ticker: 3635 (Koei Tecmo) - confirmed to be tomorrow in previous steps
    target_ticker = "3635"
    
    # Check if already registered
    existing = c.execute("SELECT id FROM portfolio_transactions WHERE user_id = ? AND ticker = ?", (user_id, target_ticker)).fetchone()
    
    if existing:
        print(f"User already has {target_ticker} in portfolio.")
    else:
        print(f"Adding {target_ticker} to {nickname}'s portfolio for testing...")
        c.execute("""
            INSERT INTO portfolio_transactions (user_id, ticker, shares, price, transaction_date, account_type)
            VALUES (?, ?, 100, 1000, ?, 'general')
        """, (user_id, target_ticker, datetime.date.today().strftime('%Y-%m-%d')))
        conn.commit()
        print("Required simulation data added.")

conn.close()
