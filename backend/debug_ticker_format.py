import sqlite3
import datetime

conn = sqlite3.connect('frontend/investor_news.db')
c = conn.cursor()

print("--- IR Events Tickers ---")
events = c.execute("SELECT ticker, company_name FROM ir_events LIMIT 5").fetchall()
for e in events:
    print(f"{e[0]} ({e[1]})")

print("\n--- Portfolio Tickers ---")
try:
    portfolios = c.execute("SELECT ticker FROM portfolio_transactions LIMIT 5").fetchall()
    for p in portfolios:
        print(f"{p[0]}")
except Exception as e:
    print(f"Error reading portfolio: {e}")

print("\n--- Alerts Tickers ---")
try:
    alerts = c.execute("SELECT ticker FROM alerts LIMIT 5").fetchall()
    for a in alerts:
        print(f"{a[0]}")
except Exception as e:
    print(f"Error reading alerts: {e}")

# Check specific users with tomorrow's events
today = datetime.date.today()
tomorrow = today + datetime.timedelta(days=1)
tomorrow_str = tomorrow.strftime('%Y-%m-%d')
print(f"\nChecking potential Alert matches for Tomorrow ({tomorrow_str})...")

tomorrow_events = c.execute("SELECT ticker FROM ir_events WHERE event_date = ?", (tomorrow_str,)).fetchall()
tomorrow_tickers = [t[0] for t in tomorrow_events]
print(f"Found {len(tomorrow_tickers)} events for tomorrow.")

if tomorrow_tickers:
    # Check if any user watches these
    placeholders = ','.join('?' for _ in tomorrow_tickers)
    
    # Portfolio
    query_p = f"SELECT DISTINCT ticker FROM portfolio_transactions WHERE ticker IN ({placeholders})"
    matches_p = c.execute(query_p, tomorrow_tickers).fetchall()
    print(f"Portfolio Matches: {[m[0] for m in matches_p]}")
    
    # Alerts
    query_a = f"SELECT DISTINCT ticker FROM alerts WHERE ticker IN ({placeholders})"
    matches_a = c.execute(query_a, tomorrow_tickers).fetchall()
    print(f"Alerts Matches: {[m[0] for m in matches_a]}")

conn.close()
