
import requests
from bs4 import BeautifulSoup
import re

def debug_ticker(ticker):
    # Target the Finance (Kessan) page directly
    url = f"https://kabutan.jp/stock/finance?code={ticker}&mode=k"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"--- Fetching {url} ---")
    res = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {res.status_code}")
    
    if res.status_code != 200:
        return

    soup = BeautifulSoup(res.text, 'html.parser')

    # 1. Dump Table Headers
    print("\n--- Table Headers ---")
    for th in soup.find_all('th'):
        txt = th.get_text().strip()
        if txt:
            print(f"TH: {txt}")

    # 2. Dump Forecast Rows (Look for '予')
    print("\n--- Forecast Rows (予) ---")
    # Find rows where the first cell contains '予' or '決算期'
    for tr in soup.find_all('tr'):
        text = tr.get_text()
        if '予' in text or '決算期' in text:
            row_data = [td.get_text(strip=True) for td in tr.find_all(['th', 'td'])]
            print(f"Row: {row_data}")
            
    print("\n--- End Debug ---")
            
    print("\n--- End Debug ---")

if __name__ == "__main__":
    debug_ticker("2975")
