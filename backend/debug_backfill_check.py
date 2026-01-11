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
        
        # Structure hunt: Find where "決算" appears in the text
        print("Searching for '決算' text nodes to identify structure...")
        results = soup.find_all(string=re.compile("決算"))
        
        print(f"Found {len(results)} occurrences of '決算'.")
        
        for i, text_node in enumerate(results[:5]):
            parent = text_node.parent
            print(f"\n[Match {i}]")
            print(f"  Text: {text_node.strip()[:50]}...")
            print(f"  Parent Tag: <{parent.name}> (Class: {parent.get('class')})")
            print(f"  Grandparent Tag: <{parent.parent.name}> (Class: {parent.parent.get('class')})")
            
            # Check if there is a link nearby
            link = parent.find('a') if parent.name != 'a' else parent
            if not link:
                link = parent.find_parent('a')
            
            if link:
                print(f"  Nearby Link Text: {link.get_text().strip()}")
                print(f"  Nearby Link Href: {link.get('href')}")
            else:
                print("  No link directly associated.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_past_date()
