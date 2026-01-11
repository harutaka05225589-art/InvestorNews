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
        
        # We found tables with class 's_news_list' but they had 0 links?
        # Let's inspect them closely.
        news_tables = soup.find_all('table', class_='s_news_list')
        print(f"Found {len(news_tables)} tables with class 's_news_list'")
        
        for i, t in enumerate(news_tables):
            print(f"\n[News Table {i}] Classes: {t.get('class')}")
            # Print first 500 chars of HTML to see what's inside
            print(f"  Content Preview: {str(t)[:500]}")
            
            # Check for ANY text inside
            print(f"  Text Content: {t.get_text().strip()[:200]}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_past_date()
