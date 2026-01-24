import sqlite3
import os
import datetime
from database import get_db_connection
from send_line import send_line_push

def check_upcoming_earnings():
    print(f"[{datetime.datetime.now()}] Checking upcoming earnings...")
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # 1. Get Earnings events for Tomorrow (or Today?)
    # Usually users want to know "Tomorrow is the day"
    today = datetime.date.today()
    target_date = today + datetime.timedelta(days=1) # Tomorrow
    target_str = target_date.strftime('%Y-%m-%d')
    
    print(f"  Target Date: {target_str}")
    
    events = c.execute("SELECT ticker, company_name FROM ir_events WHERE event_date = ?", (target_str,)).fetchall()
    
    count = 0
    for event in events:
        ticker = event['ticker']
        name = event['company_name']
        
        # 2. Find watchers for this ticker who have notify_earnings = 1
        watchers = c.execute("""
            SELECT u.line_user_id 
            FROM alerts a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.ticker = ? AND u.notify_earnings = 1 AND u.line_user_id IS NOT NULL
        """, (ticker,)).fetchall()
        
        if watchers:
            msg = f"📅 【決算発表】\n明日({target_str})は\n{name} ({ticker})\nの決算発表日です。"
            print(f"    -> Notifying {len(watchers)} users about {name}")
            
            for w in watchers:
                send_line_push(w['line_user_id'], msg)
                count += 1
                
    conn.close()
    print(f"  Sent {count} earnings notifications.")

if __name__ == "__main__":
    check_upcoming_earnings()
