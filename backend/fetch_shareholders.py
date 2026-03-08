import requests
from bs4 import BeautifulSoup
import re
import datetime
import sqlite3
from database import get_db_connection

def fetch_shareholders(ticker):
    """
    Fetches major shareholders from Kabutan.
    Returns: list of dicts
    """
    url = f"https://kabutan.jp/stock/holder?code={ticker}"
    print(f"Fetching shareholders for {ticker} from {url}")
    
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        res = requests.get(url, headers=headers, timeout=15)
        if res.status_code != 200:
            print(f"  Error: Status {res.status_code}")
            return []
            
        soup = BeautifulSoup(res.content, "html.parser")
        
        # Strategy: Find table with "株主名" header
        tables = soup.find_all("table")
        target_table = None
        
        for table in tables:
            rows = table.find_all("tr")
            if not rows: continue
            header_text = rows[0].get_text().strip()
            # Match "株主" AND ("持株" OR "持ち株" OR "株式数" OR "比率")
            if "株主" in header_text and ("持株" in header_text or "持ち株" in header_text or "株式数" in header_text or "比率" in header_text):
                target_table = table
                break
        
        if not target_table:
            # Fallback: Sometimes structure varies
            # Try finding div id="holder_list"
            div = soup.find("div", {"id": "holder_list"})
            if div:
                target_table = div.find("table")
        
        if not target_table:
            print(f"  Shareholder table not found. (Checked {len(tables)} tables)")
            for i, tbl in enumerate(tables):
                rows = tbl.find_all("tr")
                if rows:
                    print(f"    Table {i} Header: {rows[0].get_text().strip()[:30]}...")
            return []

        results = []
        rows = target_table.find_all("tr")
        
        # Columns usually: [Rank, Name, Changes, Ratio, Shares] (or similar)
        # Parse header to be sure? Kabutan usually stable.
        # Verified Header: ['株主名', '変動', '比率(%)', '株式数'] OR ['順位', '株主名', ...]
        
        # Let's inspect first row to guess structure or just assume standard
        # Standard Kabutan:
        # Row 1: Headers
        # Row 2+: Data
        
        # Try to find "As Of" date
        # Pattern: 2024年9月30日現在 or 24/09/30現在
        # Also Kabutan might have: 【2024年9月30日現在】
        page_text = soup.get_text()
        date_match = re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日現在', page_text)
        
        entry_date = datetime.date.today().strftime("%Y-%m-%d")
        if date_match:
            y, m, d = date_match.groups()
            entry_date = f"{y}-{int(m):02d}-{int(d):02d}"
            print(f"  Found shareholder date: {entry_date}")
        else:
             # Fallback: check for YY/MM format?
             # But default to Today is safer than wrong guess.
             # However, if we run this daily, we might create duplicate entries for same "real" date.
             # Ideally we want the "real" underlying date.
             pass
        
        for i, row in enumerate(rows[1:]):
            cols = row.find_all(["td", "th"])
            if not cols: continue
            
            # Text cleaning
            texts = [c.get_text().strip() for c in cols]
            
            # Expected: [Name, Change, Ratio, Count] (4 cols) or similar
            # If 4 cols:
            # 0: Name
            # 1: Change (Arrow)
            # 2: Ratio
            # 3: Count
            
            if len(texts) >= 5:
                # 0: Rank (1( 1)), 1: Name, 2: Change, 3: Ratio, 4: Count
                name = texts[1]
                
                # Ratio
                try:
                    ratio_str = texts[3].replace('%', '')
                    if not ratio_str: ratio = 0.0
                    else: ratio = float(ratio_str)
                except:
                    ratio = 0.0
                
                # Count
                count_str = texts[4]
                
                results.append({
                    "ticker": ticker,
                    "date": entry_date,
                    "shareholder_name": name,
                    "share_count": count_str,
                    "share_ratio": ratio,
                    "rank": i + 1
                })
        
        return results

    except Exception as e:
        print(f"  Fetch Error: {e}")
        return []

def save_shareholders(shareholders):
    if not shareholders: return
    conn = get_db_connection()
    c = conn.cursor()
    
    count = 0
    # Add snapshot logic?
    # If we run this daily, we might duplicate data if it hasn't changed.
    # But user wants history.
    # Kabutan data update frequency is not daily.
    # Maybe we should check if data for "today" already exists?
    # Or check if data differs from latest entry?
    
    # Simple approach for now:
    # Save with DATE.
    # Uniqueness is (ticker, date, name).
    # If we run multiple times a day, we update "today's" entry.
    
    for s in shareholders:
        c.execute("""
            INSERT INTO stock_shareholders 
            (ticker, entry_date, shareholder_name, share_count, share_ratio, rank, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(ticker, entry_date, shareholder_name) DO UPDATE SET
                share_count=excluded.share_count,
                share_ratio=excluded.share_ratio,
                rank=excluded.rank,
                updated_at=CURRENT_TIMESTAMP
        """, (s['ticker'], s['date'], s['shareholder_name'], s['share_count'], s['share_ratio'], s['rank']))
        count += 1
        
    conn.commit()
    conn.close()
    print(f"  Saved {count} shareholder records.")

if __name__ == "__main__":
    # Test
    data = fetch_shareholders("7203")
    save_shareholders(data)
