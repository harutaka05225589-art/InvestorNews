import schedule
import time
import sqlite3
import yfinance as yf
from database import get_db_connection
from datetime import datetime, timedelta

def check_alerts():
    print(f"[{datetime.now()}] Checking alerts...")
    conn = get_db_connection()
    c = conn.cursor()

    # Fetch active alerts
    # Join with users to ensure user still exists (though FK cascade should handle it)
    alerts = c.execute('''
        SELECT a.id, a.user_id, a.ticker, a.target_per, a.condition, a.last_triggered_at 
        FROM alerts a
        WHERE a.is_active = 1
    ''').fetchall()

    if not alerts:
        print("No active alerts found.")
        conn.close()
        return

    # Group by ticker to minimize API calls
    tickers = set([a['ticker'] for a in alerts])
    print(f"Checking {len(tickers)} unique tickers: {tickers}")

    # Fetch data for all tickers
    # Note: yfinance expects tickers like "7203.T" for Japan
    ticker_map = {t: f"{t}.T" for t in tickers}
    
    try:
        data = yf.Tickers(" ".join(ticker_map.values()))
    except Exception as e:
        print(f"Failed to fetch data: {e}")
        conn.close()
        return

    triggered_alerts = []

    for alert in alerts:
        # Cooldown check (prevent spamming every check)
        # e.g., don't trigger again if triggered in last 24 hours
        if alert['last_triggered_at']:
            last_time = datetime.strptime(alert['last_triggered_at'], '%Y-%m-%d %H:%M:%S')
            if datetime.now() - last_time < timedelta(hours=24):
                continue

        ticker = alert['ticker']
        yf_ticker = ticker_map[ticker]
        
        try:
            info = data.tickers[yf_ticker].info
            
            # Calculate PER
            # Sometimes 'trailingPE' or 'forwardPE' is available
            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            eps = info.get('trailingEps')
            
            if not current_price:
                # Fallback: history
                hist = data.tickers[yf_ticker].history(period="1d")
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
            
            if not current_price:
                print(f"Could not get price for {ticker}")
                continue

            # If EPS is missing, we can't calculate PER.
            # Alternately, we can rely on 'trailingPE' if provided by yfinance
            per = info.get('trailingPE')
            
            # If per is None but we have price and EPS
            if per is None and current_price and eps:
                per = current_price / eps
            
            if per is None:
                print(f"Could not calculate PER for {ticker}")
                continue
                
            print(f"{ticker}: Price={current_price}, PER={per:.2f}, Target={alert['target_per']} ({alert['condition']})")

            # Check Condition
            triggered = False
            if alert['condition'] == 'BELOW' and per <= alert['target_per']:
                triggered = True
            elif alert['condition'] == 'ABOVE' and per >= alert['target_per']:
                triggered = True

            if triggered:
                print(f"  !!! TRIGGERED: {ticker} PER {per:.2f} {alert['condition']} {alert['target_per']}")
                triggered_alerts.append({
                    'alert': alert,
                    'current_per': per,
                    'current_price': current_price
                })

        except Exception as e:
            print(f"Error processing {ticker}: {e}")
            continue

    # Process triggered alerts
    for item in triggered_alerts:
        alert = item['alert']
        per = item['current_per']
        price = item['current_price']
        
        # 1. Create Notification
        msg = f"【PER通知】{alert['ticker']}のPERが{per:.2f}になりました (目標: {alert['target_per']} {alert['condition'] == 'BELOW' and '以下' or '以上'})"
        c.execute('''
            INSERT INTO notifications (user_id, alert_id, message)
            VALUES (?, ?, ?)
        ''', (alert['user_id'], alert['id'], msg))
        
        # 2. Update Alert last_triggered_at
        c.execute('''
            UPDATE alerts SET last_triggered_at = ? WHERE id = ?
        ''', (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), alert['id']))
        
        conn.commit()

    conn.close()
    print("Check complete.")

def job():
    check_alerts()

if __name__ == "__main__":
    # Ensure tables exist (including notifications)
    from database import init_db
    init_db()

    print("Starting PER Alert Scheduler...")
    # Run once on start
    job()
    
    # Schedule every hour (market hours ideally, but 24h for simplicity now)
    schedule.every(1).hours.do(job)
    
    while True:
        schedule.run_pending()
        time.sleep(60)
