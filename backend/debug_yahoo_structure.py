
import requests
from bs4 import BeautifulSoup
import re

def debug_yahoo(ticker):
    url = f"https://finance.yahoo.co.jp/quote/{ticker}.T"
    print(f"Fetching {url}")
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Encoding: {res.encoding}")
    
    # Yahoo JP usually utf-8
    soup = BeautifulSoup(res.text, "html.parser")
    
    # Search for "決算"
    # Usually in a definition list or table
    # <span class="_1-M57H7c">決算</span> ... <span class="_1-M57H7c">3月末日</span>
    # Or in the summary
    
    found = False
    
    # Strategy 1: Search for text "決算" in all tags
    print("\n--- Search by Text Content ---")
    vals = soup.find_all(string=re.compile("決算"))
    for v in vals:
        print(f"Found match: '{v.strip()[:20]}...'")
        parent = v.parent
        print(f"  Parent: {parent.name}")
        
        if parent.name == 'script':
            print("  --- Script Content Snippet ---")
            # escaping might be needed?
            content = v.string
            # Find context
            idx = content.find("決算")
            start = max(0, idx - 100)
            end = min(len(content), idx + 100)
            print(f"  ...{content[start:end]}...")
            
            # Try to find the value associated
            # "settlementDate": "3月末日"?
            # or "決算": "3月末日"
            
            # Check for regex pattern inside script
            # 決算.*?(\d+)月末
            m = re.search(r'決算.*?(\d+)月末', content)
            if m:
                print(f"  MATCH in Script: {m.group(1)}月")

if __name__ == "__main__":
    debug_yahoo("1726")
