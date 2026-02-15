import sys
import requests
from bs4 import BeautifulSoup
import re

# Force UTF-8 for Windows console
sys.stdout.reconfigure(encoding='utf-8')

def test_fetch_holders(ticker):
    url = f"https://kabutan.jp/stock/holder?code={ticker}"
    print(f"Fetching {url}...")
    
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.content, "html.parser")
    
    today_text = soup.get_text()
    # Look for "現在" (As of) patterns
    # e.g. "2024年9月30日現在" or "24/09/30現在"
    # Also check: "24.09.30" or "2024.09.30"
    
    print(f"Text Sample: {today_text[:500]}...")
    
    div_holders = soup.find("div", {"id": "holder_list"})

    # Specific check near the table
    if div_holders:
        print(f"Holder Div Text: {div_holders.get_text()[:500]}...")
    
    tables = soup.find_all("table")
    print(f"Found {len(tables)} tables.")
    
    for i, table in enumerate(tables):
        header_text = ""
        rows = table.find_all("tr")
        if rows:
            header_text = rows[0].get_text().strip().replace("\n", " ")
        
        print(f"\n--- Table {i} Header: {header_text[:50]}... ---")
        
        # Check for "株主名" or "持株数"
        if "株主名" in header_text:
            print("  Found potential shareholder table!")
            for row in rows[1:6]:
                cols = [c.get_text().strip() for c in row.find_all(["td", "th"])]
                print(f"  {cols}")

if __name__ == "__main__":
    test_fetch_holders("8035") # Tokyo Electron
