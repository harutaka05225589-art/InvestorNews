
import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()

ticker = '1726'
print(f"Checking {ticker}...")

c.execute("""
    SELECT id, title, dividend_forecast_annual, dividend_rights_month, dividend_payment_month 
    FROM revisions 
    WHERE ticker = ? 
    ORDER BY revision_date DESC 
    LIMIT 3
""", (ticker,))

rows = c.fetchall()
for r in rows:
    print(r)

conn.close()
