import time
import datetime
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fetch_tdnet import fetch_tdnet_revisions

POLL_INTERVAL = 1800  # 30 minutes

def poll_tdnet():
    print(f"Starting TDnet Polling Service (Interval: {POLL_INTERVAL}s = {POLL_INTERVAL//60}min)...")
    while True:
        try:
            now = datetime.datetime.now()
            print(f"\n[Poller] checking at {now.strftime('%H:%M:%S')}...")
            # trigger_ai=False: AI analysis is disabled to save API costs
            fetch_tdnet_revisions(trigger_ai=False)
            
            print(f"[Poller] check complete. Sleeping {POLL_INTERVAL//60}min.")
            time.sleep(POLL_INTERVAL)
            
        except KeyboardInterrupt:
            print("Stopping Poller...")
            break
        except Exception as e:
            print(f"Poller Error: {e}")
            time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    poll_tdnet()
