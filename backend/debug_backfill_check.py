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
        
        # main_body not found. Let's look for tables.
        # Typically news lists are in a table with class 's_news_list' or just a table.
        tables = soup.find_all('table')
        print(f"Total tables found: {len(tables)}")
        
        links = []
        for t in tables:
            # Check if this table looks like a news list (has many links)
            t_links = t.find_all('a')
            if len(t_links) > 5:
                print(f"Table with {len(t_links)} links found. Classes: {t.get('class')}")
                # Add these links to our candidates
                links.extend(t_links)
        
        if not links:
            print("No suitable table links found. Checking raw 'li' tags?")
            links = soup.find_all('a') # Fallback
            
        print(f"Total candidate links: {len(links)}")
        
        count = 0
        debug_printed = 0
        for link in links:
            text = link.get_text().strip()
            
            # Print first few links just to see what we are getting
            if debug_printed < 10 and text:
                print(f"  Link: '{text}' (Href: {link.get('href')})")
                debug_printed += 1

            # Same logic as backfill script
            match = re.search(r'(.+?)\s*<(\d{4})>', text)
            if match:
                 if any(k in text for k in ['決算', '修正', '配当', '業績']):
                    count += 1
                    if count <= 3:
                        print(f"  [MATCH] Found: {text}")
        
        print(f"Total matched events found: {count}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_past_date()
