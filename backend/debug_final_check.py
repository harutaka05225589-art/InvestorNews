import requests
from bs4 import BeautifulSoup
import re

def check_irbank():
    url = "https://irbank.net/ir_schedule"
    print(f"\n[1] Checking IR Bank: {url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding
        soup = BeautifulSoup(res.text, 'html.parser')
        title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
        print(f"  Title: {title}")
        
        # Check for future dates (e.g. 2月 or 3月)
        body = soup.get_text()
        dates = re.findall(r'\d{1,2}月\d{1,2}日', body)
        print(f"  Dates sample: {dates[:5]}...")
        if "7203" in body or "トヨタ" in body:
            print("  SUCCESS: Found Toyota (7203)!")
        else:
            print("  Toyota not found.")

    except Exception as e:
        print(f"  Error: {e}")

def check_traders_v2():
    # Found in previous debug: /market_jp/schedule_m
    url = "https://www.traders.co.jp/market_jp/schedule_m"
    print(f"\n[2] Checking Traders Web (Monthly): {url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding
        soup = BeautifulSoup(res.text, 'html.parser')
        title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
        print(f"  Title: {title}")
        
        # Check if there are links to "Next Month"
        links = soup.find_all('a', href=True)
        for l in links:
            txt = l.get_text().strip()
            if "翌月" in txt or "来月" in txt or "2026年" in txt:
                print(f"  Found Nav Link: [{txt}] -> {l.get('href')}")
                
        # Check for dates
        body = soup.get_text()
        dates = re.findall(r'\d{1,2}月\d{1,2}日', body)
        print(f"  Dates sample: {dates[:5]}...")

    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    check_irbank()
    check_traders_v2()
