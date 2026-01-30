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
    schedule.every().day.at("01:00").do(weekly_job)
    
    # Also run once on startup to ensure data is fresh? 
    # Maybe not, as it takes time. Let's just wait for schedule.
    
    while True:
        schedule.run_pending()
        time.sleep(60)
