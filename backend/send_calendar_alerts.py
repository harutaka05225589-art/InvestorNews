import sqlite3
import os
import datetime
from database import get_db_connection
from send_line import send_line_push

def send_calendar_alerts():
    print(f"[{datetime.datetime.now()}] Starting Calendar Alerts...")
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    try:
        today = datetime.date.today()
        target_dates = [
            (today, "今日", "【決算発表】今日"),
            (today + datetime.timedelta(days=2), "明後日", "【決算予告】明後日")
        ]

        for target_date, date_label, prefix in target_dates:
            target_str = target_date.strftime('%Y-%m-%d')
            print(f"Checking events for {target_str} ({date_label})...")

            # Get events for this date
            events = c.execute("SELECT ticker, company_name FROM ir_events WHERE event_date = ?", (target_str,)).fetchall()
            
            if not events:
                print(f"  No events found for {target_str}.")
                continue

            print(f"  Found {len(events)} events.")

            for event in events:
                ticker = event['ticker']
                company_name = event['company_name']
                
                # Find interested users (Portfolio OR Alerts) who have LINE linked
                # We use UNION to combine users from both sources
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
                users = c.execute(query, (ticker, ticker)).fetchall()

                if not users:
                    continue

                for user in users:
                    line_id = user['line_user_id']
                    nickname = user['nickname'] or "ゲスト"
                    
                    msg = f"{prefix} ({target_str}) は\n{company_name} ({ticker}) の決算発表日です！\n\n保有/ウォッチ銘柄の動向に注目しましょう。"
                    
                    print(f"  -> Sending LINE to {nickname} (ID: ...{line_id[-4:]}) for {ticker}")
                    send_line_push(line_id, msg)

    except Exception as e:
        print(f"Error in send_calendar_alerts: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    send_calendar_alerts()
