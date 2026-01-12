import sqlite3
import os
import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def reset_future():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    today = datetime.date.today().strftime('%Y-%m-%d')
    print(f"Deleting IR events from {today} onwards...")
    
    c.execute("DELETE FROM ir_events WHERE event_date >= ?", (today,))
    deleted = c.rowcount
    
    conn.commit()
    conn.close()
    
    print(f"Deleted {deleted} future events.")
    print("Please run 'python3 fetch_ir_calendar.py' immediately to re-populate with correct data.")

if __name__ == "__main__":
    reset_future()
