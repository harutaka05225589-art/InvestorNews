import requests
from bs4 import BeautifulSoup
import re

def check_url(url, encoding=None):
    print(f"\nChecking: {url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if encoding:
            res.encoding = encoding
        else:
            res.encoding = res.apparent_encoding
            
        print(f"  Status: {res.status_code}")
        if res.status_code != 200: return

        soup = BeautifulSoup(res.text, 'html.parser')
        title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
        print(f"  Title: {title[:50]}...")
        
        # Check for dates (e.g., 2月6日)
        body_text = soup.get_text()
        dates = re.findall(r'\d{1,2}月\d{1,2}日', body_text)
        print(f"  Dates sample: {dates[:5]}...")
        
        # Check for toyota (7203)
        if "7203" in body_text or "トヨタ" in body_text:
            print("  SUCCESS: Found 7203/Toyota!")
        else:
            print("  Toyota not found.")

    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    # 1. Traders Web (Modern URL?)
    # Search suggest: https://www.traders.co.jp/domestic_stocks/domestic_market/kessan_s/kessan_s.asp
    # But site renewal happened.
    check_url("https://www.traders.co.jp/domestic_stocks/domestic_market/kessan_s/kessan_s.asp") # Old?
    
    # 2. Nikkei
    check_url("https://www.nikkei.com/markets/kigyo/money-schedule/")
    
    # 3. Rakuten (Search result [1])
    check_url("https://www.rakuten-sec.co.jp/web/market/calendar/")
    
    # 4. Monex (Search result [6])
    # check_url("https://info.monex.co.jp/news/settlement/index.html")
