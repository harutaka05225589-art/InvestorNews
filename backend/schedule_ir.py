import schedule
import time
import datetime
import traceback
import sys
import os

# Import job functions
from fetch_ir_calendar import run_fetch
from send_calendar_alerts import send_calendar_alerts
from send_promo import send_promo
from fetch_edinet_financials import fetch_edinet_financial_list, download_and_process_report
from fetch_edinet_shareholders import run_daily_edinet_shareholder_update
from analyze_revisions_ai import process_revisions
from summarize_market import generate_market_summary
from generate_daily_wrapup import generate_report as generate_daily_wrapup_report
from update_all_shareholders import run_weekly_shareholder_update
from check_admin_watchlist import check_watchlist

def log(message):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")
    sys.stdout.flush()

# --- Job Wrappers with Robust Error Handling ---

def job_daily_ir_fetch():
    log("TASK START: Daily IR Calendar Sync (JPX)")
    try:
        # days_back=3 to catch minor late updates, days_forward=180 for future view
        run_fetch(days_back=3, days_forward=180)
        log("TASK SUCCESS: Daily IR Calendar Sync")
    except Exception as e:
        log(f"TASK ERROR: Daily IR Calendar Sync: {e}\n{traceback.format_exc()}")

def job_daily_ai_analysis():
    log("TASK START: AI Analysis Retry/Sync")
    try:
        process_revisions()
        log("TASK SUCCESS: AI Analysis")
    except Exception as e:
        log(f"TASK ERROR: AI Analysis: {e}\n{traceback.format_exc()}")

def job_daily_calendar_alerts():
    log("TASK START: LINE Calendar Alerts")
    try:
        send_calendar_alerts()
        log("TASK SUCCESS: LINE Calendar Alerts")
    except Exception as e:
        log(f"TASK ERROR: LINE Calendar Alerts: {e}\n{traceback.format_exc()}")

def job_daily_promo_tweet():
    log("TASK START: X (Twitter) Promo Tweet")
    try:
        send_promo()
        log("TASK SUCCESS: X Promo Tweet")
    except Exception as e:
        log(f"TASK ERROR: X Promo Tweet: {e}\n{traceback.format_exc()}")

def job_daily_edinet_financials():
    log("TASK START: EDINET Financials Daily Check")
    try:
        today = datetime.date.today()
        # Check Today and Yesterday for completeness
        for i in range(2):
            d_str = (today - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
            docs = fetch_edinet_financial_list(d_str)
            for doc in docs:
                code = doc.get('docTypeCode', '')
                # 120: Yuho, 130: Quarterly, 140: Semiannual
                if code in ['120', '130', '140']:
                    download_and_process_report(doc)
        log("TASK SUCCESS: EDINET Financials Check")
    except Exception as e:
        log(f"TASK ERROR: EDINET Financials Check: {e}\n{traceback.format_exc()}")

def job_daily_edinet_shareholders():
    log("TASK START: EDINET Shareholder Update")
    try:
        run_daily_edinet_shareholder_update()
        log("TASK SUCCESS: EDINET Shareholder Update")
    except Exception as e:
        log(f"TASK ERROR: EDINET Shareholder Update: {e}\n{traceback.format_exc()}")

def job_daily_market_summary():
    log("TASK START: AI Market Summary Generation")
    try:
        generate_market_summary()
        log("TASK SUCCESS: AI Market Summary")
    except Exception as e:
        log(f"TASK ERROR: AI Market Summary: {e}\n{traceback.format_exc()}")

def job_daily_wrapup():
    log("TASK START: AI Daily Wrapup Report Generation")
    try:
        generate_daily_wrapup_report()
        log("TASK SUCCESS: AI Daily Wrapup Report")
    except Exception as e:
        log(f"TASK ERROR: AI Daily Wrapup Report: {e}\n{traceback.format_exc()}")

def job_weekly_shareholders():
    log("TASK START: Weekly Kabutan Shareholder Update")
    try:
        run_weekly_shareholder_update()
        log("TASK SUCCESS: Weekly Kabutan Shareholder Update")
    except Exception as e:
        log(f"TASK ERROR: Weekly Kabutan Shareholder Update: {e}\n{traceback.format_exc()}")

def job_admin_watchlist_check():
    log("TASK START: Admin Watchlist Price Check")
    try:
        check_watchlist(refresh_only=False)
        log("TASK SUCCESS: Admin Watchlist Price Check")
    except Exception as e:
        log(f"TASK ERROR: Admin Watchlist Price Check: {e}\n{traceback.format_exc()}")

def job_heartbeat():
    log("HEARTBEAT: Scheduler is running...")

# --- Main Scheduling Logic ---

if __name__ == "__main__":
    log("=== Investor News Scheduler Starting (Unified Daily Mode) ===")

    # 1. CORE DATA SYNC (Nightly)
    schedule.every().day.at("01:00").do(job_daily_ir_fetch)
    # NOTE: AI analysis is handled by tdnet_poller every 60s. No need for separate schedule.

    # 1.5. SUMMARY REPORTS (Evening)
    schedule.every().day.at("17:00").do(job_daily_market_summary)
    schedule.every().day.at("17:15").do(job_daily_wrapup)

    # 2. NOTIFICATIONS & PROMOS (Daytime) - Max 1 promo/day (tweet limit is 7/day total)
    schedule.every().day.at("12:00").do(job_daily_promo_tweet)
    schedule.every().day.at("09:00").do(job_daily_calendar_alerts)

    # 3. OFFICIAL DISCLOSURES (Evening)
    schedule.every().day.at("09:30").do(job_daily_edinet_financials)
    schedule.every().day.at("18:30").do(job_daily_edinet_financials)
    schedule.every().day.at("19:00").do(job_daily_edinet_shareholders)

    # 3.5 ADMIN STOCK WATCHLIST (Market hours)
    schedule.every().day.at("09:30").do(job_admin_watchlist_check)
    schedule.every().day.at("15:30").do(job_admin_watchlist_check)

    # 3.6 WEEKLY SCRAPING (Weekend)
    schedule.every().sunday.at("20:00").do(job_weekly_shareholders)

    # 4. MONITORING
    schedule.every().hour.do(job_heartbeat)

    log(f"Successfully registered {len(schedule.jobs)} jobs.")
    
    # Run once on start for heartbeat confirmation
    job_heartbeat()

    while True:
        try:
            schedule.run_pending()
        except Exception as e:
            log(f"CRITICAL: Scheduler loop encountered an error: {e}")
        time.sleep(60)
