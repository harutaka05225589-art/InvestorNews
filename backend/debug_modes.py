import requests
from bs4 import BeautifulSoup
import re

def check(url):
    print(f"\nChecking {url}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        res = requests.get(url, headers=headers, timeout=5)
        print(f"Status: {res.status_code}")
        print(f"Effective URL: {res.url}")
        
        soup = BeautifulSoup(res.text, 'html.parser')
        
        h1 = soup.find('h1')
        if h1: print(f"H1: {h1.get_text().strip()}")
        
        # Look for dates in future (e.g. 2月 or 3月)
        # Scan all links for "date=..."
        links = soup.find_all('a', href=re.compile(r'date='))
        future_dates = []
        for l in links:
            href = l.get('href')
            match = re.search(r'date=(\d{8})', href)
            if match:
                d = match.group(1)
                if d.startswith('202602') or d.startswith('202603'):
                    future_dates.append(d)
        
        if future_dates:
            print(f"Found {len(set(future_dates))} future dates (Feb/Mar 2026): {sorted(list(set(future_dates)))[:5]}")
        else:
            print("No Feb/Mar 2026 dates found in links.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # 1. Weekly Mode?
    check("https://kabutan.jp/warning/?mode=5_2")
    # 2. Earnings Top?
    check("https://kabutan.jp/warning/?mode=5")
    # 3. Monthly?
    check("https://kabutan.jp/warning/?mode=5_3")
    # 4. Access "Next Month" via parameter?
    check("https://kabutan.jp/warning/?mode=5_1&date=202602")
