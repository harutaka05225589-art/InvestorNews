import sys
import requests
from bs4 import BeautifulSoup
import re

# Force UTF-8 for Windows console
sys.stdout.reconfigure(encoding='utf-8')

def test_fetch_finance(ticker):
    url = f"https://kabutan.jp/stock/finance?code={ticker}&mode=k"
    print(f"Fetching {url}...")
    
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.content, "html.parser")
    
    tables = soup.find_all("table")
    print(f"Found {len(tables)} tables.")
    
    for i, table in enumerate(tables):
        # Look for table headers to identify type
        header_text = ""
        rows = table.find_all("tr")
        if rows:
            header_text = rows[0].get_text().strip().replace("\n", " ")
        
        print(f"\n--- Table {i} Header: {header_text[:50]}... ---")
        
        # Print first few data rows
        for row in rows[1:6]: # Print more rows
            cols = [c.get_text().strip() for c in row.find_all(["td", "th"])]
            print(f"  {cols}")

if __name__ == "__main__":
    test_fetch_finance("7203") # Toyota
