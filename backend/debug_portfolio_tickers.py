import sqlite3

conn = sqlite3.connect('frontend/investor_news.db')
c = conn.cursor()

print("--- Portfolio Tickers (Limit 20) ---")
try:
    portfolios = c.execute("SELECT ticker FROM portfolio_transactions LIMIT 20").fetchall()
    for p in portfolios:
        print(f"'{p[0]}'")
except Exception as e:
    print(f"Error reading portfolio: {e}")

print("\n--- Alerts Tickers (Limit 20) ---")
try:
    alerts = c.execute("SELECT ticker FROM alerts LIMIT 20").fetchall()
    for a in alerts:
        print(f"'{a[0]}'")
except Exception as e:
    print(f"Error reading alerts: {e}")

conn.close()
