import requests
from bs4 import BeautifulSoup
import re
import datetime

LOG_FILE = "chk_log.txt"

def log(msg):
    print(msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def check_monthly():
    # Clear log
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("Starting check...\n")

    url = "https://kabutan.jp/warning/?mode=5_3"
    log(f"Fetching {url}...")
    headers = {
        'User-Agent': 'Mozilla/5.0'
    }
    try:
        res = requests.get(url, headers=headers)
        log(f"Status: {res.status_code}")
        
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 1. Look for calendar table
        # Attempt to find links with date=YYYYMMDD
        links = soup.find_all('a', href=re.compile(r'date=(\d{8})'))
        
        valid_dates = sorted(list(set([re.search(r'date=(\d{8})', l.get('href')).group(1) for l in links])))
        
        log(f"Found {len(valid_dates)} valid daily links.")
        if valid_dates:
             log(f"First 5: {valid_dates[:5]}")
             log(f"Last 5: {valid_dates[-5:]}")
             
        # 2. Check for Next Month Link
        # Kabutan monthly navigation usually involves query param ?mode=5_3&date=YYYYMM
        
        # Keep it simple: Try to fetch Next Month explicitely
        today = datetime.date.today()
        # Next month
        if today.month == 12:
            next_m = today.replace(year=today.year+1, month=1, day=1)
        else:
            next_m = today.replace(month=today.month+1, day=1)
            
        ym_str = next_m.strftime('%Y%m')
        next_url = f"https://kabutan.jp/warning/?mode=5_3&date={ym_str}"
        log(f"\nFetching Next Month: {next_url}")
        
        res2 = requests.get(next_url, headers=headers)
        soup2 = BeautifulSoup(res2.text, 'html.parser')
        links2 = soup2.find_all('a', href=re.compile(r'date=(\d{8})'))
        valid_dates2 = sorted(list(set([re.search(r'date=(\d{8})', l.get('href')).group(1) for l in links2])))
        
        log(f"Found {len(valid_dates2)} valid daily links for next month.")
        if valid_dates2:
             log(f"First 5: {valid_dates2[:5]}")

    except Exception as e:
        log(f"Error: {e}")

if __name__ == "__main__":
    check_monthly()
