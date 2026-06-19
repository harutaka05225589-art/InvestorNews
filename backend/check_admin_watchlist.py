"""
Admin-only stock price checker using yfinance.
- Fetches live prices for admin_watchlist items
- Checks price alert conditions (above/below target, 52w drop, PER)
- Sends LINE notification to admin when conditions are met
- Prevents duplicate alerts (same type, same day)

Usage:
  python3 check_admin_watchlist.py           # Check all and send alerts
  python3 check_admin_watchlist.py --refresh  # Just refresh prices (no alerts)
"""
import yfinance as yf
import sqlite3
import os
import sys
import json
import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def get_admin_line_id():
    """Get admin's LINE user ID from DB."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT line_user_id FROM users WHERE is_admin = 1 AND line_user_id IS NOT NULL LIMIT 1").fetchone()
    conn.close()
    return row['line_user_id'] if row else None

def check_watchlist(refresh_only=False):
    """
    Main function: fetch prices, check conditions, send alerts.
    If refresh_only=True, just update prices without sending alerts.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    items = c.execute("SELECT * FROM admin_watchlist WHERE is_active = 1").fetchall()
    if not items:
        print("No active watchlist items.")
        conn.close()
        return []

    admin_line_id = get_admin_line_id() if not refresh_only else None
    today_str = datetime.date.today().isoformat()
    now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    results = []
    alerts_to_send = []

    for item in items:
        ticker = item['ticker']
        name = item['name']
        print(f"Checking {name} ({ticker})...")

        try:
            stock = yf.Ticker(ticker)
            info = stock.info

            price = info.get("currentPrice") or info.get("regularMarketPrice")
            high_52w = info.get("fiftyTwoWeekHigh")
            per = info.get("trailingPE") or info.get("forwardPE")
            market_cap = info.get("marketCap")

            if price is None:
                print(f"  [SKIP] No price data for {ticker}")
                continue

            # Calculate drop from 52-week high
            drop_pct = round((price / high_52w - 1) * 100, 1) if price and high_52w else None

            # Calculate market cap in oku-en (億円)
            market_cap_oku = round(market_cap / 100_000_000, 1) if market_cap else None

            # Buy signal check
            buy_signal = False
            reasons = []

            drop_threshold = item['drop_threshold'] or -20
            per_limit_val = item['per_limit'] or 15

            if drop_pct is not None and drop_pct <= drop_threshold:
                buy_signal = True
                reasons.append(f"52週高値から{abs(drop_pct)}%下落")

            if per is not None and per <= per_limit_val:
                buy_signal = True
                reasons.append(f"PER{round(per, 1)}倍")

            # Update DB with latest data
            c.execute("""
                UPDATE admin_watchlist
                SET last_price = ?, high_52w = ?, drop_pct = ?,
                    current_per = ?, market_cap_oku = ?,
                    buy_signal = ?, signal_reasons = ?,
                    last_checked_at = ?
                WHERE id = ?
            """, (
                price, high_52w, drop_pct,
                round(per, 1) if per else None, market_cap_oku,
                '◎' if buy_signal else '', ' / '.join(reasons),
                now_str, item['id']
            ))

            print(f"  Price: {price}, 52w High: {high_52w}, Drop: {drop_pct}%, PER: {per}")

            # --- Alert Condition Check ---
            if not refresh_only and admin_line_id:
                alert_types = []

                # Price above alert
                if item['price_above'] and price >= item['price_above']:
                    alert_types.append(f"above_{item['price_above']}")

                # Price below alert
                if item['price_below'] and price <= item['price_below']:
                    alert_types.append(f"below_{item['price_below']}")

                # Buy signal alert
                if buy_signal:
                    alert_types.append("buy_signal")

                # Check for duplicate alerts today
                last_alerted = item['last_alerted_at']
                last_alert_type = item['last_alert_type'] or ''

                for alert_type in alert_types:
                    # Skip if same alert was already sent today
                    if last_alerted and last_alerted[:10] == today_str and alert_type in last_alert_type:
                        print(f"  [SKIP] Alert '{alert_type}' already sent today")
                        continue

                    # Build alert message
                    if alert_type.startswith("above_"):
                        target = item['price_above']
                        msg = f"📈 【株価アラート】{name}({ticker})\n\n株価が目標上限 {target:,.0f}円 を突破しました！\n\n現在値: {price:,.0f}円\n52週高値: {high_52w:,.0f}円\n高値からの下落率: {drop_pct}%"
                    elif alert_type.startswith("below_"):
                        target = item['price_below']
                        msg = f"📉 【株価アラート】{name}({ticker})\n\n株価が目標下限 {target:,.0f}円 を下回りました！\n\n現在値: {price:,.0f}円\n52週高値: {high_52w:,.0f}円\n高値からの下落率: {drop_pct}%"
                    elif alert_type == "buy_signal":
                        msg = f"🎯 【買いシグナル】{name}({ticker})\n\n条件達成: {' / '.join(reasons)}\n\n現在値: {price:,.0f}円\n52週高値: {high_52w:,.0f}円\n高値からの下落率: {drop_pct}%"
                        if per:
                            msg += f"\nPER: {round(per, 1)}倍"
                    else:
                        continue

                    if market_cap_oku:
                        msg += f"\n時価総額: {market_cap_oku:,.1f}億円"

                    alerts_to_send.append({
                        'item_id': item['id'],
                        'alert_type': alert_type,
                        'message': msg
                    })

            result = {
                'id': item['id'],
                'name': name,
                'ticker': ticker,
                'price': price,
                'high_52w': high_52w,
                'drop_pct': drop_pct,
                'per': round(per, 1) if per else None,
                'market_cap_oku': market_cap_oku,
                'buy_signal': buy_signal,
                'reasons': reasons,
            }
            results.append(result)

        except Exception as e:
            print(f"  [ERROR] {name} ({ticker}): {e}")
            continue

    conn.commit()

    # Send accumulated alerts
    if alerts_to_send and admin_line_id:
        try:
            from send_line import send_line_push

            for alert in alerts_to_send:
                print(f"  -> Sending LINE alert: {alert['alert_type']}")
                send_line_push(admin_line_id, alert['message'])

                # Update last_alerted_at
                # Append alert type to existing ones for today
                existing = c.execute("SELECT last_alerted_at, last_alert_type FROM admin_watchlist WHERE id = ?", (alert['item_id'],)).fetchone()
                if existing and existing['last_alerted_at'] and existing['last_alerted_at'][:10] == today_str:
                    new_types = (existing['last_alert_type'] or '') + ',' + alert['alert_type']
                else:
                    new_types = alert['alert_type']

                c.execute("""
                    UPDATE admin_watchlist
                    SET last_alerted_at = ?, last_alert_type = ?
                    WHERE id = ?
                """, (now_str, new_types, alert['item_id']))

            conn.commit()
            print(f"\n✅ Sent {len(alerts_to_send)} alert(s) to admin LINE.")
        except Exception as e:
            print(f"[ERROR] Failed to send LINE alerts: {e}")

    conn.close()

    # Print summary table
    print(f"\n{'='*80}")
    print(f"{'銘柄':<12} {'株価':>8} {'52週高値':>10} {'下落率':>8} {'PER':>6} {'時価総額':>10} {'シグナル':>8}")
    print(f"{'='*80}")
    for r in results:
        sig = '◎' if r['buy_signal'] else ''
        per_str = f"{r['per']}" if r['per'] else '-'
        mc_str = f"{r['market_cap_oku']:,.0f}億" if r['market_cap_oku'] else '-'
        dp_str = f"{r['drop_pct']}%" if r['drop_pct'] is not None else '-'
        print(f"{r['name']:<12} {r['price']:>8,.0f} {r['high_52w'] or 0:>10,.0f} {dp_str:>8} {per_str:>6} {mc_str:>10} {sig:>8}")

    return results


if __name__ == '__main__':
    refresh_only = '--refresh' in sys.argv
    if refresh_only:
        print("=== Refresh Only Mode (no alerts) ===")
    else:
        print("=== Full Check Mode (with alerts) ===")
    check_watchlist(refresh_only=refresh_only)
