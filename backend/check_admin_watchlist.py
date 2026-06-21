"""
Admin-only stock price checker using yfinance.
- Fetches live prices for admin_watchlist items
- Checks price alert conditions (above/below target, 52w drop, PER)
- Checks new alert conditions:
    #3 ATH drop, #5 PBR, #6 Dividend Yield, #14 Volume Spike,
    #8 Yuutai Change, #9 Earnings Date, #10 Revision, #15 Dilution
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
import logging
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)

DB_PATH = os.path.join(os.path.dirname(BASE_DIR), 'frontend', 'investor_news.db')

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

            # --- New metric calculations ---

            # #3 ATH (All-Time High) drop
            ath_price = None
            ath_drop_pct_val = None
            try:
                if item['ath_drop_threshold'] is not None:
                    hist = stock.history(period='max')
                    if hist is not None and not hist.empty and 'High' in hist.columns:
                        ath_price = float(hist['High'].max())
                        if ath_price and ath_price > 0:
                            ath_drop_pct_val = round((price / ath_price - 1) * 100, 1)
            except Exception as e:
                logger.warning(f"  [WARN] ATH fetch error for {ticker}: {e}")

            # #5 PBR
            current_pbr = info.get('priceToBook')
            if current_pbr is not None:
                try:
                    current_pbr = round(float(current_pbr), 2)
                except (ValueError, TypeError):
                    current_pbr = None

            # #6 Dividend Yield
            raw_dividend_yield = info.get('dividendYield')
            current_dividend_yield = None
            if raw_dividend_yield is not None:
                try:
                    current_dividend_yield = round(float(raw_dividend_yield) * 100, 2)  # Convert ratio to %
                except (ValueError, TypeError):
                    current_dividend_yield = None

            # #14 Volume spike data
            volume = info.get('volume')
            avg_volume = info.get('averageVolume')

            # Update DB with latest data (including new columns)
            c.execute("""
                UPDATE admin_watchlist
                SET last_price = ?, high_52w = ?, drop_pct = ?,
                    current_per = ?, market_cap_oku = ?,
                    buy_signal = ?, signal_reasons = ?,
                    last_checked_at = ?,
                    ath_price = ?, ath_drop_pct = ?,
                    current_pbr = ?, current_dividend_yield = ?
                WHERE id = ?
            """, (
                price, high_52w, drop_pct,
                round(per, 1) if per else None, market_cap_oku,
                '◎' if buy_signal else '', ' / '.join(reasons),
                now_str,
                ath_price, ath_drop_pct_val,
                current_pbr, current_dividend_yield,
                item['id']
            ))

            print(f"  Price: {price}, 52w High: {high_52w}, Drop: {drop_pct}%, PER: {per}")
            if ath_price:
                print(f"  ATH: {ath_price}, ATH Drop: {ath_drop_pct_val}%")
            if current_pbr is not None:
                print(f"  PBR: {current_pbr}")
            if current_dividend_yield is not None:
                print(f"  Dividend Yield: {current_dividend_yield}%")

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

                # #3 ATH Drop alert (上場来高値からの下落率)
                if (item['ath_drop_threshold'] is not None
                        and ath_drop_pct_val is not None
                        and ath_drop_pct_val <= item['ath_drop_threshold']):
                    alert_types.append("ath_drop")

                # #5 PBR alert (PBR到達)
                if (item['pbr_limit'] is not None
                        and current_pbr is not None
                        and current_pbr <= item['pbr_limit']):
                    alert_types.append("pbr_below")

                # #6 Dividend Yield alert (配当利回り到達)
                if (item['dividend_yield_min'] is not None
                        and current_dividend_yield is not None
                        and current_dividend_yield >= item['dividend_yield_min']):
                    alert_types.append("dividend_yield")

                # #14 Volume Spike alert (出来高急増)
                if (item['volume_spike_ratio'] is not None
                        and volume is not None and avg_volume is not None
                        and avg_volume > 0
                        and volume / avg_volume >= item['volume_spike_ratio']):
                    alert_types.append("volume_spike")

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
                    elif alert_type == "ath_drop":
                        msg = (
                            f"📉 【上場来高値アラート】{name}({ticker})\n\n"
                            f"上場来高値から{abs(ath_drop_pct_val)}%下落しました！\n"
                            f"（設定しきい値: {item['ath_drop_threshold']}%）\n\n"
                            f"上場来高値: {ath_price:,.0f}円\n"
                            f"現在値: {price:,.0f}円\n"
                            f"下落率: {ath_drop_pct_val}%"
                        )
                    elif alert_type == "pbr_below":
                        msg = (
                            f"📊 【PBRアラート】{name}({ticker})\n\n"
                            f"PBRが目標の{item['pbr_limit']}倍以下になりました！\n\n"
                            f"現在PBR: {current_pbr}倍\n"
                            f"現在値: {price:,.0f}円"
                        )
                    elif alert_type == "dividend_yield":
                        msg = (
                            f"💰 【配当利回りアラート】{name}({ticker})\n\n"
                            f"配当利回りが目標の{item['dividend_yield_min']}%以上になりました！\n\n"
                            f"現在利回り: {current_dividend_yield}%\n"
                            f"現在値: {price:,.0f}円"
                        )
                    elif alert_type == "volume_spike":
                        ratio = round(volume / avg_volume, 1) if avg_volume else 0
                        msg = (
                            f"🔥 【出来高急増アラート】{name}({ticker})\n\n"
                            f"出来高が平均の{ratio}倍に急増しています！\n"
                            f"（設定しきい値: {item['volume_spike_ratio']}倍）\n\n"
                            f"本日出来高: {volume:,}\n"
                            f"平均出来高: {avg_volume:,}\n"
                            f"現在値: {price:,.0f}円"
                        )
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
                'ath_price': ath_price,
                'ath_drop_pct': ath_drop_pct_val,
                'current_pbr': current_pbr,
                'current_dividend_yield': current_dividend_yield,
            }
            results.append(result)

        except Exception as e:
            print(f"  [ERROR] {name} ({ticker}): {e}")
            continue

    conn.commit()

    # Send accumulated price/metric alerts
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
            print(f"\n✅ Sent {len(alerts_to_send)} price/metric alert(s) to admin LINE.")
        except Exception as e:
            print(f"[ERROR] Failed to send LINE alerts: {e}")

    conn.close()

    # ========================================================================
    # Event-Based Alerts (separate section, uses a second DB connection)
    # ========================================================================
    if not refresh_only and admin_line_id:
        event_alerts = []
        conn2 = sqlite3.connect(DB_PATH)
        conn2.row_factory = sqlite3.Row
        c2 = conn2.cursor()

        # Re-fetch items to get fresh last_alert_type after price alert updates
        items_fresh = c2.execute("SELECT * FROM admin_watchlist WHERE is_active = 1").fetchall()

        for item in items_fresh:
            ticker = item['ticker']
            name = item['name']
            last_alerted = item['last_alerted_at']
            last_alert_type = item['last_alert_type'] or ''

            # #9 Earnings Date Approaching (次回決算日接近)
            if item['alert_earnings_date'] == 1:
                alert_type = "earnings_date"
                if not (last_alerted and last_alerted[:10] == today_str and alert_type in last_alert_type):
                    try:
                        rows = c2.execute("""
                            SELECT event_date, company_name FROM ir_events
                            WHERE ticker = ? AND event_date BETWEEN date('now') AND date('now', '+7 days')
                        """, (ticker,)).fetchall()

                        for row in rows:
                            event_date = row['event_date']
                            company_name = row['company_name'] or name
                            days_remaining = (datetime.datetime.strptime(event_date, '%Y-%m-%d').date() - datetime.date.today()).days
                            msg = (
                                f"📅 【決算日接近アラート】{company_name}({ticker})\n\n"
                                f"次回決算日まであと{days_remaining}日です！\n\n"
                                f"決算日: {event_date}\n"
                                f"現在値: {item['last_price']:,.0f}円" if item['last_price'] else
                                f"📅 【決算日接近アラート】{company_name}({ticker})\n\n"
                                f"次回決算日まであと{days_remaining}日です！\n\n"
                                f"決算日: {event_date}"
                            )
                            event_alerts.append({
                                'item_id': item['id'],
                                'alert_type': alert_type,
                                'message': msg
                            })
                    except Exception as e:
                        logger.warning(f"  [WARN] Earnings date check error for {ticker}: {e}")

            # #10 Upward/Downward Revision (上方/下方修正)
            if item['alert_revision'] == 1:
                alert_type = "revision"
                if not (last_alerted and last_alerted[:10] == today_str and alert_type in last_alert_type):
                    try:
                        rows = c2.execute("""
                            SELECT * FROM revisions
                            WHERE ticker = ? AND revision_date = date('now')
                            AND abs(COALESCE(revision_rate_op, 0)) >= 10
                        """, (ticker,)).fetchall()

                        for row in rows:
                            revision_rate = row['revision_rate_op'] if 'revision_rate_op' in row.keys() else 0
                            direction = "上方" if revision_rate > 0 else "下方"
                            msg = (
                                f"📝 【業績修正アラート】{name}({ticker})\n\n"
                                f"{direction}修正が発表されました！\n\n"
                                f"修正率: {revision_rate:+.1f}%\n"
                                f"現在値: {item['last_price']:,.0f}円" if item['last_price'] else
                                f"📝 【業績修正アラート】{name}({ticker})\n\n"
                                f"{direction}修正が発表されました！\n\n"
                                f"修正率: {revision_rate:+.1f}%"
                            )
                            event_alerts.append({
                                'item_id': item['id'],
                                'alert_type': alert_type,
                                'message': msg
                            })
                    except Exception as e:
                        logger.warning(f"  [WARN] Revision check error for {ticker}: {e}")

            # #8 Shareholder Benefit Change (優待変更・廃止)
            if item['alert_yuutai_change'] == 1:
                alert_type = "yuutai_change"
                if not (last_alerted and last_alerted[:10] == today_str and alert_type in last_alert_type):
                    try:
                        rows = c2.execute("""
                            SELECT title, published_at FROM news_items
                            WHERE ticker = ? AND title LIKE '%優待%'
                            AND date(published_at) >= date('now', '-1 day')
                        """, (ticker,)).fetchall()

                        for row in rows:
                            msg = (
                                f"🎁 【優待変更アラート】{name}({ticker})\n\n"
                                f"優待に関するニュースがあります：\n"
                                f"{row['title']}\n\n"
                                f"配信日時: {row['published_at']}"
                            )
                            event_alerts.append({
                                'item_id': item['id'],
                                'alert_type': alert_type,
                                'message': msg
                            })
                    except Exception as e:
                        logger.warning(f"  [WARN] Yuutai change check error for {ticker}: {e}")

            # #15 Dilution Events (希薄化・需給悪化)
            if item['alert_dilution'] == 1:
                alert_type = "dilution"
                if not (last_alerted and last_alerted[:10] == today_str and alert_type in last_alert_type):
                    try:
                        rows = c2.execute("""
                            SELECT title, published_at FROM news_items
                            WHERE ticker = ?
                            AND (title LIKE '%増資%' OR title LIKE '%新株予約権%' OR title LIKE '%ワラント%'
                                 OR title LIKE '%転換社債%' OR title LIKE '%CB%' OR title LIKE '%ロックアップ%'
                                 OR title LIKE '%売出%')
                            AND date(published_at) >= date('now', '-1 day')
                        """, (ticker,)).fetchall()

                        for row in rows:
                            msg = (
                                f"⚠️ 【希薄化・需給悪化アラート】{name}({ticker})\n\n"
                                f"希薄化リスクのあるニュースがあります：\n"
                                f"{row['title']}\n\n"
                                f"配信日時: {row['published_at']}"
                            )
                            event_alerts.append({
                                'item_id': item['id'],
                                'alert_type': alert_type,
                                'message': msg
                            })
                    except Exception as e:
                        logger.warning(f"  [WARN] Dilution check error for {ticker}: {e}")

        # Send event-based alerts
        if event_alerts:
            try:
                from send_line import send_line_push

                for alert in event_alerts:
                    print(f"  -> Sending LINE event alert: {alert['alert_type']}")
                    send_line_push(admin_line_id, alert['message'])

                    # Update last_alerted_at
                    existing = c2.execute("SELECT last_alerted_at, last_alert_type FROM admin_watchlist WHERE id = ?", (alert['item_id'],)).fetchone()
                    if existing and existing['last_alerted_at'] and existing['last_alerted_at'][:10] == today_str:
                        new_types = (existing['last_alert_type'] or '') + ',' + alert['alert_type']
                    else:
                        new_types = alert['alert_type']

                    c2.execute("""
                        UPDATE admin_watchlist
                        SET last_alerted_at = ?, last_alert_type = ?
                        WHERE id = ?
                    """, (now_str, new_types, alert['item_id']))

                conn2.commit()
                print(f"\n✅ Sent {len(event_alerts)} event alert(s) to admin LINE.")
            except Exception as e:
                print(f"[ERROR] Failed to send event LINE alerts: {e}")

        conn2.close()

    # Print summary table
    print(f"\n{'='*120}")
    print(f"{'銘柄':<12} {'株価':>8} {'52週高値':>10} {'下落率':>8} {'PER':>6} {'時価総額':>10} {'PBR':>6} {'配当利回り':>10} {'ATH':>10} {'ATH下落':>8} {'シグナル':>8}")
    print(f"{'='*120}")
    for r in results:
        sig = '◎' if r['buy_signal'] else ''
        per_str = f"{r['per']}" if r['per'] else '-'
        mc_str = f"{r['market_cap_oku']:,.0f}億" if r['market_cap_oku'] else '-'
        dp_str = f"{r['drop_pct']}%" if r['drop_pct'] is not None else '-'
        pbr_str = f"{r['current_pbr']}" if r.get('current_pbr') is not None else '-'
        dy_str = f"{r['current_dividend_yield']}%" if r.get('current_dividend_yield') is not None else '-'
        ath_str = f"{r['ath_price']:,.0f}" if r.get('ath_price') else '-'
        ath_dp_str = f"{r['ath_drop_pct']}%" if r.get('ath_drop_pct') is not None else '-'
        print(f"{r['name']:<12} {r['price']:>8,.0f} {r['high_52w'] or 0:>10,.0f} {dp_str:>8} {per_str:>6} {mc_str:>10} {pbr_str:>6} {dy_str:>10} {ath_str:>10} {ath_dp_str:>8} {sig:>8}")

    event_alert_count = 0
    try:
        if not refresh_only and admin_line_id:
            event_alert_count = len(event_alerts)
    except NameError:
        pass
    total_alerts = len(alerts_to_send) + event_alert_count
    if total_alerts:
        print(f"\n📬 合計 {total_alerts} 件のアラートを送信しました。")

    return results


if __name__ == '__main__':
    refresh_only = '--refresh' in sys.argv
    if refresh_only:
        print("=== Refresh Only Mode (no alerts) ===")
    else:
        print("=== Full Check Mode (with alerts) ===")
    check_watchlist(refresh_only=refresh_only)
