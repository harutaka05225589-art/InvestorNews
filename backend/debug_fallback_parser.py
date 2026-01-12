import requests
from bs4 import BeautifulSoup
import re
import datetime

def is_market_code(txt):
    known_codes = ['東P', '東S', '東G', '名P', '名M', '札', '福', '東証プライム', '東証スタンダード', '東証グロース']
    if txt in known_codes: return True
    if re.match(r'^[東名札福][証]?[PGMS12１２ＰＧＭＳ\s]*$', txt): return True
    return False

def test_fallback(date_str):
    url = f"https://kabutan.jp/stock/finance?code=&date={date_str}"
    print(f"Testing Fallback URL: {url}")
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {res.status_code}")
        
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # DEBUG: Print table info
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables.")
        
        events = []
        for i, table in enumerate(tables):
            print(f"  Table {i} rows: {len(table.find_all('tr'))}")
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if not cols: continue
                
                # Check for ticker
                row_txt = row.get_text()
                match = re.search(r'\b(\d{4})\b', row_txt)
                if match:
                    ticker = match.group(1)
                    # Try to find name
                    name = "Unknown"
                    links = row.find_all('a')
                    for l in links:
                        txt = l.get_text().strip()
                        if not txt.isdigit() and len(txt) > 1 and "kabutan" not in txt:
                            name = txt
                            break
                    
                    print(f"    Found Row: Ticker={ticker}, Name={name}")
                    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_fallback("2026/01/13") # Known to have data
    test_fallback("2026/01/14") # Check target date
