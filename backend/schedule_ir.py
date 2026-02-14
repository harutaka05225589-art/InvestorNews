import schedule
import time
import datetime
from fetch_ir_calendar import run_fetch

def weekly_job():
    print(f"Starting Weekly IR Update at {datetime.datetime.now()}")
    # Update future 6 months, and check past 7 days for any missed corrections
    run_fetch(days_back=7, days_forward=180)

if __name__ == "__main__":
    print("IR Scheduler started. Running every Sunday at 01:00 AM.")
    
    # Schedule for Daily check at 01:00 AM
    # Job Wrappers for Safety (prevent crash on holidays/errors)
    def safe_weekly_job():
        try: weekly_job()
        except Exception as e: print(f"Weekly Job Error: {e}")

    def safe_calendar_alerts():
        try: send_calendar_alerts()
        except Exception as e: print(f"Calendar Alerts Error: {e}")

    def safe_promo():
        try: send_promo()
        except Exception as e: print(f"Promo Tweet Error: {e}")

    # Schedule for Daily check at 01:00 AM
    schedule.every().day.at("01:00").do(safe_weekly_job)

    # Calendar Alerts (Daily at 09:00)
    from send_calendar_alerts import send_calendar_alerts
    schedule.every().day.at("09:00").do(safe_calendar_alerts)

    # Promo Tweet (Daily at 08:30, 12:00, 17:30)
    from send_promo import send_promo
    schedule.every().day.at("08:30").do(safe_promo)
    schedule.every().day.at("12:00").do(safe_promo)
    schedule.every().day.at("17:30").do(safe_promo)
    
    # EDINET Financials (Daily Check twice)
    from fetch_edinet_financials import fetch_edinet_financial_list, download_and_process_report
    def daily_edinet_check():
        print(f"Starting EDINET Daily Check at {datetime.datetime.now()}")
        try:
            today = datetime.date.today()
            # Check Today and Yesterday (just in case)
            for i in range(2):
                d_str = (today - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
                docs = fetch_edinet_financial_list(d_str)
                for doc in docs:
                    code = doc.get('docTypeCode', '')
                    if code in ['120', '130', '140']:
                        download_and_process_report(doc)
        except Exception as e:
            print(f"EDINET Check Error: {e}")
    
    schedule.every().day.at("09:30").do(daily_edinet_check) # Morning check for previous day/early reports
    schedule.every().day.at("18:30").do(daily_edinet_check) # Evening check for today's reports
    
    while True:
        schedule.run_pending()
        time.sleep(60)
