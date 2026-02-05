import datetime
import time
from fetch_tdnet import fetch_tdnet_revisions

# Temporarily override the AI analysis call in fetch_tdnet
import fetch_tdnet
original_process = None
try:
    from analyze_revisions_ai import process_revisions as original_process
    # Monkey patch to disable AI during fetch
    fetch_tdnet.process_revisions = lambda: print("(AI analysis skipped for now)")
except:
    pass

def fetch_week():
    print("=== Fetching Past 7 Days of TDnet Data (No AI Analysis) ===")
    today = datetime.datetime.now()
    
    for i in range(7):
        target_date = today - datetime.timedelta(days=i)
        date_str = target_date.strftime('%Y-%m-%d')
        print(f"\n[{i+1}/7] Processing {date_str}...")
        
        try:
            fetch_tdnet_revisions(target_date=target_date)
            time.sleep(1)  # Be gentle to TDnet server
        except Exception as e:
            print(f"Error processing {date_str}: {e}")
    
    print("\n=== Fetch Complete ===")
    print("Run 'python analyze_revisions_ai.py' to extract dividend data from PDFs.")

if __name__ == "__main__":
    fetch_week()
