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
        
        # Target the specific listmenu found in previous logs
        print("Looking for div.listmenu_kessan...")
        target_div = soup.find('div', class_='listmenu_kessan')
        if not target_div:
            print("listmenu_kessan not found, trying generic 'listmenu'...")
            target_div = soup.find('div', class_='listmenu')
            
        if target_div:
            # Print first 10 links inside this div
            links = target_div.find_all('a')
            print(f"Links in target div: {len(links)}")
            for i, link in enumerate(links[:20]):
                print(f"  [Link {i}] Text: '{link.get_text().strip()}'")
                print(f"           Href: {link.get('href')}")
        else:
            print("Could not find div.listmenu or class listmenu_kessan")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_past_date()
