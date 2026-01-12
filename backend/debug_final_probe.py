import requests
from bs4 import BeautifulSoup
import re

def check_traders_params():
    base_url = "https://www.traders.co.jp/market_jp/schedule_m"
    # Guess common params
    params = [
        "?ym=202602",
        "?y=2026&m=02",
        "?date=202602",
        "?k_im=202602" # Used in old ASP
    ]
    
    print("\n--- [Traders Web] Parameter Probe ---")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    for p in params:
        url = base_url + p
        print(f"Testing: {url}")
        try:
            res = requests.get(url, headers=headers, timeout=5)
            # Check for February specific dates (2/6, 2月6日)
            if "2月6日" in res.text or "02月06日" in res.text:
                print(f"  HIT! Found '2月6日' in response.")
                # Check for Toyota
                if "7203" in res.text or "トヨタ" in res.text:
                    print("  DOUBLE HIT! Found Toyota (7203)!")
            else:
                print("  No Feb 6 date found.")
        except Exception as e:
            print(f"  Error: {e}")

def check_jpx_files():
    url = "https://www.jpx.co.jp/listing/event-schedules/financial-announcement/index.html"
    print(f"\n--- [JPX] File Scan: {url} ---")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Look for .xls, .xlsx, .pdf links
        files = soup.find_all('a', href=re.compile(r'\.(xls|xlsx|pdf|csv)$'))
        print(f"Found {len(files)} file links.")
        
        for f in files:
            hr = f.get('href')
            txt = f.get_text().strip()
            print(f"File: [{txt}] -> {hr}")
            
    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    check_traders_params()
    check_jpx_files()
