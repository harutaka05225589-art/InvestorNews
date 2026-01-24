import schedule
import time
import sqlite3
import os
import requests
from send_email import send_alert_email
from datetime import datetime

# DB Config
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

# J-Quants or Yahoo Finance scraping (Simplified for this example)
# Note: For production, use J-Quants API (User has requested free options, so we might need scraping)
# WARNING: Scraping Yahoo Finance is fragile.

def get_current_price(ticker):
    # TODO: Implement actual price fetching. 
    # For now, this is a mock to prevent errors until we decide on a data source.
    # User might need to implement scraping logic or use a free API.
    return 0

def check_alerts():
    print(f"[{datetime.now()}] Checking alerts...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    try:
        # Get active alerts
        c.execute("SELECT * FROM alerts")
        alerts = c.fetchall()

        for alert in alerts:
            ticker = alert['ticker']
            target_price = alert['target_price']
            condition = alert['condition'] # 'above' or 'below'
            user_id = alert['user_id']

            current_price = get_current_price(ticker)
            if current_price == 0:
                continue

            # Check condition
            is_hit = False
            if condition == 'above' and current_price >= target_price:
                is_hit = True
            elif condition == 'below' and current_price <= target_price:
                is_hit = True

            if is_hit:
                # Get User settings
                # Ensure we also check notify_price here or in the SQL above if possible, but alerting logic loops alerts first
                user = c.execute("SELECT email, email_notifications, line_user_id, notify_price FROM users WHERE id = ?", (user_id,)).fetchone()
                
                if user and user['notify_price'] == 1: # Check preference
                    # LINE Notification (Priority)
                    if user['line_user_id']:
                        from send_line import send_line_push
                        line_msg = f"【アラート】{ticker}が目標価格({target_price}円)に到達しました。\n現在値: {current_price}円"
                        send_line_push(user['line_user_id'], line_msg)
                        
                    # Email Notification
                    if user['email'] and user['email_notifications'] == 1:
                        subject = f"【アラート】{ticker}が目標価格に到達しました"
                        body = f"""
                        <h2>目標価格到達のお知らせ</h2>
                        <p>登録していた銘柄が条件を満たしました。</p>
                        <ul>
                            <li>銘柄: {ticker}</li>
                            <li>現在値: {current_price}円</li>
                            <li>目標値: {target_price}円 ({'以上' if condition == 'above' else '以下'})</li>
                        </ul>
                        <a href="https://rich-investor-news.com/alerts">アラート設定を確認する</a>
                        """
                        send_alert_email(user['email'], subject, body)
                        print(f"Alert emailed to {user['email']} for {ticker}")

    except Exception as e:
        print(f"Error checking alerts: {e}")
    finally:
        conn.close()

def job():
    check_alerts()

if __name__ == "__main__":
    print("Starting Alert Scheduler...")
    # Run every 30 minutes
    schedule.every(30).minutes.do(job)
    
    # Run once immediately
    job()

    while True:
        schedule.run_pending()
        time.sleep(1)
