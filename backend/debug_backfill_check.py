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
        
        # Survey ALL tables to find the right one
        tables = soup.find_all('table')
        print(f"Total tables found: {len(tables)}")
        
        for i, t in enumerate(tables):
            links = t.find_all('a')
            print(f"\n[Table {i}] Classes: {t.get('class')} - Link Count: {len(links)}")
            
            # Print first 3 links to ID the table purpose
            for j, lnk in enumerate(links[:3]):
                print(f"  Link {j}: {lnk.get_text().strip()}")
        
        # Also check for likely UL classes
        ul_news = soup.find('ul', class_='s_news_list')
        if ul_news:
            print("\n[Found ul.s_news_list]")
            ul_links = ul_news.find_all('a')
            print(f"  Link Count: {len(ul_links)}")
            for j, lnk in enumerate(ul_links[:3]):
                print(f"  Link {j}: {lnk.get_text().strip()}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_past_date()
