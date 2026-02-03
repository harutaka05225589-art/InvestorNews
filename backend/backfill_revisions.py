import datetime
import time
from fetch_tdnet import fetch_tdnet_revisions

def backfill():
    print("Starting 40-day backfill for TDnet Revisions...")
    today = datetime.datetime.now()
    
    # Go back 40 days
    for i in range(40):
        target_date = today - datetime.timedelta(days=i)
        date_str = target_date.strftime('%Y-%m-%d')
        print(f"\nProcessing {date_str} (Day {i+1}/40)...")
        
        try:
            fetch_tdnet_revisions(target_date=target_date)
            # Sleep to avoid hitting TDnet too hard
            time.sleep(2)
        except Exception as e:
            print(f"Error processing {date_str}: {e}")

    print("\nBackfill Completed.")

if __name__ == "__main__":
    backfill()
