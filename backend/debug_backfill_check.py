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
            print("Found div.listmenu_kessan. Checking siblings...")
            
            # Look at the next few siblings
            sibling = target_div.find_next_sibling()
            count = 0
            while sibling and count < 3:
                if sibling.name: # Skip NavigableStrings (whitespace)
                    print(f"\n[Sibling {count}] Tag: <{sibling.name}> Class: {sibling.get('class')}")
                    
                    # Check for links in this sibling
                    s_links = sibling.find_all('a')
                    print(f"  Links inside: {len(s_links)}")
                    
                    for i, lnk in enumerate(s_links[:10]):
                        print(f"    Link {i}: {lnk.get_text().strip()}")
                    
                    count += 1
                sibling = sibling.find_next_sibling()
        else:
            print("Could not find div.listmenu or class listmenu_kessan")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_past_date()
