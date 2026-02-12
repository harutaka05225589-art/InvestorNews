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
        # Dictionary to aggregate messages: { line_id: { 'nickname': str, 'sections': [] } }
        alerts_by_user = {}

        today = datetime.date.today()
        target_dates = [
            (today, "今日", "【決算発表】今日"),
            (today + datetime.timedelta(days=1), "明日", "【決算予告】明日"),
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
                    
                    if line_id not in alerts_by_user:
                        alerts_by_user[line_id] = {
                            'nickname': nickname,
                            'sections': []
                        }
                    
                    # Create a section for this date if it doesn't exist
                    # We want to group by date label inside the message
                    # But simpler: just append "【明日】社名 (Code)" lines
                    alerts_by_user[line_id]['sections'].append(f"{prefix} ({target_str}): {company_name} ({ticker})")

        # 3. Send aggregated messages
        print(f"Aggregated alerts for {len(alerts_by_user)} users.")
        
        for line_id, data in alerts_by_user.items():
            nickname = data['nickname']
            sections = data['sections']
            
            if not sections:
                continue
                
            # Join all alerts
            body = "\n".join(sections)
            msg = f"📅 決算カレンダー通知\n\n{body}\n\n保有/ウォッチ銘柄の動向に注目しましょう。"
            
            print(f"  -> Sending LINE to {nickname} (ID: ...{line_id[-4:]}) with {len(sections)} items")
            send_line_push(line_id, msg)

    except Exception as e:
        print(f"Error in send_calendar_alerts: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    send_calendar_alerts()
