import sqlite3
import os

db_path = os.path.join('frontend', 'investor_news.db')
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit()

conn = sqlite3.connect(db_path)
c = conn.cursor()

# Get Tables
c.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in c.fetchall()]
print(f"Tables: {tables}")

# Check Counts
if 'alerts' in tables:
    c.execute("SELECT COUNT(*) FROM alerts")
    print(f"Alerts Count: {c.fetchone()[0]}")
    c.execute("PRAGMA table_info(alerts)")
    print(f"Alerts Schema: {c.fetchall()}")

if 'portfolio_transactions' in tables:
    c.execute("SELECT COUNT(*) FROM portfolio_transactions")
    print(f"Portfolio Count: {c.fetchone()[0]}")

if 'users' in tables:
    c.execute("SELECT COUNT(*) FROM users")
    print(f"Users Count: {c.fetchone()[0]}")
    c.execute("SELECT * FROM users LIMIT 1")
    print(f"Sample User: {c.fetchone()}")

conn.close()
