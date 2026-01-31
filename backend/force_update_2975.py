
import sqlite3
import os
from datetime import datetime

# DB Setup
db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
if not os.path.exists(db_path):
    db_path = 'investor_news.db'

print(f"Connecting to: {db_path}")
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Star Mica (2975) Data
# Based on latest forecast: 37.0 Annual, Nov Rights, Feb Payment
ticker = "2975"
company_name = "スター・マイカ・ホールディングス"
dividend_annual = 37.0
rights_month = 11
payment_month = 2

try:
    existing = c.execute("SELECT id FROM revisions WHERE ticker = ? AND title = 'YahooFinance_Initial'", (ticker,)).fetchone()
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    today = datetime.now().strftime('%Y-%m-%d')

    if existing:
        c.execute("""
            UPDATE revisions SET
                company_name = ?,
                dividend_forecast_annual = ?,
                dividend_rights_month = ?,
                dividend_payment_month = ?,
                ai_analyzed = 1,
                updated_at = ?
            WHERE id = ?
        """, (company_name, dividend_annual, rights_month, payment_month, now, existing[0]))
        print(f"Updated existing entry for {ticker}.")
    else:
        c.execute("""
            INSERT INTO revisions (
                ticker, company_name, revision_date, title,
                dividend_forecast_annual, dividend_rights_month, dividend_payment_month,
                ai_analyzed, created_at
            ) VALUES (?, ?, ?, 'YahooFinance_Initial', ?, ?, ?, 1, ?)
        """, (ticker, company_name, today, dividend_annual, rights_month, payment_month, now))
        print(f"Inserted new entry for {ticker}.")

    conn.commit()
    print("Success.")

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
