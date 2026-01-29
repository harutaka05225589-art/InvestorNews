import time
import datetime
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fetch_tdnet import fetch_tdnet_revisions

def poll_tdnet():
    print("Starting TDnet Polling Service (Interval: 60s)...")
    while True:
        try:
            now = datetime.datetime.now()
            # Only poll during market hours + buffer (8:00 - 18:00) 
            # or just always 24/7? TDnet updates mostly 15:00-17:00 but sometimes 08:30.
            # Let's run 24/7 to be safe and catch everything.
            
            print(f"\n[Poller] checking at {now.strftime('%H:%M:%S')}...")
            fetch_tdnet_revisions()
            
            print("[Poller] detailed check complete. Sleeping 60s.")
            time.sleep(60)
            
        except KeyboardInterrupt:
            print("Stopping Poller...")
            break
        except Exception as e:
            print(f"Poller Error: {e}")
            time.sleep(60) # Sleep even on error to avoid rapid loop

if __name__ == "__main__":
    poll_tdnet()
