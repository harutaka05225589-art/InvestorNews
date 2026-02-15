import sqlite3
import datetime

conn = sqlite3.connect('frontend/investor_news.db')
c = conn.cursor()

target_ticker = "3635"
target_date = "2026-02-13"

# 1. Check Event
print(f"Checking IR Events for {target_ticker} on {target_date}...")
event = c.execute("SELECT * FROM ir_events WHERE ticker = ? AND event_date = ?", (target_ticker, target_date)).fetchone()
if event:
    print(f"  Event Found: {event}")
else:
    print(f"  Event NOT Found!")

# 2. Check Portfolio
print(f"Checking Portfolio for {target_ticker}...")
port = c.execute("SELECT user_id FROM portfolio_transactions WHERE ticker = ?", (target_ticker,)).fetchall()
print(f"  Portfolio Entries: {port}")

# 3. Check User
if port:
    uid = port[0][0]
    user = c.execute("SELECT id, line_user_id FROM users WHERE id = ?", (uid,)).fetchone()
    print(f"  User for Portfolio: {user}")

# 4. Check Query Logic
print("Testing Match Query...")
query = """
    SELECT DISTINCT u.line_user_id, u.nickname
    FROM users u
    WHERE u.line_user_id IS NOT NULL
    AND (
        EXISTS (SELECT 1 FROM portfolio_transactions p WHERE p.user_id = u.id AND p.ticker = ?)
        OR
        EXISTS (SELECT 1 FROM alerts a WHERE a.user_id = u.id AND a.ticker = ?)
    )
"""
matches = c.execute(query, (target_ticker, target_ticker)).fetchall()
print(f"  Matches: {matches}")

conn.close()
