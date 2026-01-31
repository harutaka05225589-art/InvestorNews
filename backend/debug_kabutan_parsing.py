
import requests
from bs4 import BeautifulSoup
import re

def debug_ticker(ticker):
    url = f"https://kabutan.jp/stock/?code={ticker}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"--- Fetching {ticker} ---")
    res = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {res.status_code}")
    
    if res.status_code != 200:
        return

    soup = BeautifulSoup(res.text, 'html.parser')

    # 1. Check Title
    h2 = soup.select_one('h2')
    print(f"H2 Text: {h2.text.strip() if h2 else 'Not Found'}")

    # 2. Dump all elements containing "配当"
    print("\n--- Searching for '配当' ---")
    # Search for text nodes
    for string in soup.find_all(string=re.compile("配当")):
        parent = string.parent
        # Print the tag and its immediate parent/siblings for context
        # removing newlines for cleaner output
        p_text = parent.get_text().replace('\n', ' ').strip()
        print(f"Found in <{parent.name}>: '{p_text}'")
        
        # Check next sibling
        nxt = parent.find_next_sibling()
        if nxt:
            print(f"  -> Next Sibling <{nxt.name}>: {nxt.get_text().replace(chr(10), ' ').strip()[:50]}...")
        else:
            print(f"  -> No Next Sibling")

    # 3. Dump all elements containing "決算期"
    print("\n--- Searching for '決算期' ---")
    for string in soup.find_all(string=re.compile("決算期")):
        parent = string.parent
        p_text = parent.get_text().replace('\n', ' ').strip()
        print(f"Found in <{parent.name}>: '{p_text}'")
        nxt = parent.find_next_sibling()
        if nxt:
            print(f"  -> Next Sibling <{nxt.name}>: {nxt.get_text().replace(chr(10), ' ').strip()[:50]}...")
            
    print("\n--- End Debug ---")

if __name__ == "__main__":
    debug_ticker("2975")
