import time

def job():
    print("PER Alert System is currently disabled to comply with data usage policies.")
    print("Please upgrade to J-Quants API for commercial use.")

if __name__ == "__main__":
    print("Starting PER Alert Scheduler (Disabled Mode)...")
    job()
    while True:
        time.sleep(3600)
