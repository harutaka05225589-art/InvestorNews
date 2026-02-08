import requests
from bs4 import BeautifulSoup
import re

def debug_1726():
    ticker = "1726"
    url = f"https://kabutan.jp/stock/finance?code={ticker}&mode=k"
    print(f"Fetching {url}...")
    
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers, timeout=10)
    soup = BeautifulSoup(res.content, "html.parser")
    tables = soup.find_all("table")
    
    print(f"Found {len(tables)} tables.")
    
    for i, table in enumerate(tables):
        rows = table.find_all("tr")
        if not rows: continue
        
        header_text = rows[0].get_text().strip().replace("\n", " ")
        print(f"\nTable {i} Header: {header_text[:30]}...")
        
        prev = table.find_previous(["h2", "h3", "caption"])
        prev_text = prev.get_text().strip() if prev else "None"
        print(f"  Prev Header: {prev_text}")
        
        # Parse Headers
        h_cols = [c.get_text().strip() for c in rows[0].find_all(["th", "td"])]
        idx_map = {}
        for idx, h in enumerate(h_cols):
            if "決算期" in h: idx_map['period'] = idx
            elif "売上高" in h: idx_map['sales'] = idx
            elif "最終益" in h: idx_map['net'] = idx
            
        print(f"  Columns found: {list(idx_map.keys())}")
        
        if 'period' not in idx_map or 'sales' not in idx_map or 'net' not in idx_map:
            print("  -> Skipped (Missing columns)")
            continue

        period_type = None
        if "3ヵ月" in prev_text or "四半期" in prev_text:
             period_type = 'quarter'
        elif "業績推移" in prev_text or "通期" in prev_text:
             period_type = 'annual'
        elif "四半期" in header_text or "３ヵ月" in header_text:
             period_type = 'quarter'
        elif "通期" in header_text:
             period_type = 'annual'
        else:
            print("  -> Fallback logic triggered")
            found_valid_date = False
            for r_idx in range(1, min(6, len(rows))):
                cols = rows[r_idx].find_all(["td", "th"])
                if len(cols) > idx_map['period']:
                    date_txt = cols[idx_map['period']].get_text().strip()
                    if not date_txt or date_txt == "－": continue
                    
                    found_valid_date = True
                    print(f"    Found date: '{date_txt}'")
                    if "-" in date_txt:
                        period_type = 'quarter'
                    else:
                        period_type = 'annual'
                    break
            
            if not found_valid_date:
                period_type = 'annual-default'
        
        print(f"  -> Determined Type: {period_type}")

if __name__ == "__main__":
    debug_1726()
