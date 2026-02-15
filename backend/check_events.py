import sqlite3
import datetime

conn = sqlite3.connect('frontend/investor_news.db')
c = conn.cursor()

today = datetime.date.today()
tomorrow = today + datetime.timedelta(days=1)
day_after = today + datetime.timedelta(days=2)

print(f"Today: {today}")
print(f"Checking events for Tomorrow ({tomorrow})...")
events = c.execute("SELECT ticker, company_name FROM ir_events WHERE event_date = ?", (tomorrow.strftime('%Y-%m-%d'),)).fetchall()
print(f"Found {len(events)} events for tomorrow.")
for e in events:
    print(f"  - {e[0]} {e[1]}")

print(f"\nChecking events for Day After ({day_after})...")
events2 = c.execute("SELECT ticker, company_name FROM ir_events WHERE event_date = ?", (day_after.strftime('%Y-%m-%d'),)).fetchall()
print(f"Found {len(events2)} events for day after.")
for e in events2:
    print(f"  - {e[0]} {e[1]}")

conn.close()
