# Debug script for Yahoo/Nikkei/JPX (Version 2)
import requests
from bs4 import BeautifulSoup
import re

def check_url(name, url):
    print(f"\n[{name}] Checking: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding
        print(f"  Status: {res.status_code}")
        
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
            print(f"  Title: {title}")
            
            # Find any date-like links
            print("  --- Navigation Hints ---")
            links = soup.find_all('a', href=True)
            hints = []
            for l in links:
                txt = l.get_text().strip()
                href = l.get('href')
                if "翌日" in txt or "Next" in txt or "date=" in href or "schedule" in href:
                    hints.append(f"[{txt}] -> {href}")
            
            # Print first 5 hints
            for h in hints[:5]:
                print(f"    {h}")
            
            # Check for generic dates content
            body = soup.get_text()[:1000]
            dates = re.findall(r'\d{1,2}月\d{1,2}日', body)
            print(f"  Dates seen in body: {dates[:5]}...")

    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    # Yahoo (Base)
    check_url("Yahoo", "https://finance.yahoo.co.jp/schedule/earnings")
    
    # Nikkei (Guessing ASPX or standard path)
    check_url("Nikkei", "https://www.nikkei.com/markets/kigyo/money-schedule/kessan/")
    
    # JPX (Official)
    check_url("JPX", "https://www.jpx.co.jp/listing/event-schedules/financial-announcement/index.html")
