import requests
from bs4 import BeautifulSoup
import re

def check_past_date():
    # 2025-11-14 should have many earnings
    url = "https://kabutan.jp/news/?date=20251114&category=3"
    print(f"Testing known busy date: {url}")
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0'
        }
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding
        print(f"Status: {res.status_code}")
        
        soup = BeautifulSoup(res.text, 'html.parser')
        links = soup.find_all('a')
        count = 0
        for link in links:
            text = link.get_text().strip()
            # Same logic as backfill script
            match = re.search(r'(.+?)\s*<(\d{4})>', text)
            if match and any(k in text for k in ['決算', '修正', '配当', '業績']):
                count += 1
                if count <= 3:
                    print(f"  Found: {text}")
        
        print(f"Total events found: {count}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_past_date()
