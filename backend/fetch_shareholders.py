import sqlite3
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
import os
import sys

# Ensure backend dir is in path for database import
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import get_db_connection

def fetch_shareholders(ticker):
    """
    Fetches the top shareholders for a given ticker from Kabutan.
    Returns: list of dicts [{ticker, name, count, ratio, rank}]
    """
    url = f"https://kabutan.jp/stock/holder?code={ticker}"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            return []
            
        soup = BeautifulSoup(res.content, 'html.parser')
        
        results = []
        rank = 1
        
        for t in soup.find_all('table'):
            if '株主' in t.text or '持株比率' in t.text:
                rows = t.find_all('tr')
                # Usually row 0 and 1 are headers
                for row in rows[2:12]: # Top 10 max
                    cells = row.find_all(['th', 'td'])
                    if len(cells) >= 4:
                        name = cells[0].text.strip()
                        ratio_str = cells[2].text.strip()
                        count_str = cells[3].text.strip()
                        
                        if not name or "計" in name:
                            continue
                            
                        # Clean count string
                        count_clean = re.sub(r'[^0-9]', '', count_str)
                        # Clean ratio string
                        ratio_clean = re.sub(r'[^0-9.]', '', ratio_str)
                        
                        ratio = float(ratio_clean) if ratio_clean else 0.0
                        
                        results.append({
                            "ticker": ticker,
                            "name": name,
                            "count": count_clean,
                            "ratio": ratio,
                            "rank": rank
                        })
                        rank += 1
                break # Only process the first holder table
        return results
    except Exception as e:
        print(f"Error fetching shareholders for {ticker}: {e}")
        return []

def save_shareholders(shareholders):
    if not shareholders:
        return
        
    conn = get_db_connection()
    c = conn.cursor()
    
    ticker = shareholders[0]['ticker']
    entry_date = datetime.now().strftime('%Y-%m-%d')
    
    try:
        c.execute("DELETE FROM stock_shareholders WHERE ticker = ? AND entry_date = ?", (ticker, entry_date))
        
        for sh in shareholders:
            c.execute('''
                INSERT INTO stock_shareholders (ticker, entry_date, shareholder_name, share_count, share_ratio, rank)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (sh['ticker'], entry_date, sh['name'], sh['count'], sh['ratio'], sh['rank']))
            
        conn.commit()
    except Exception as e:
         print(f"Error saving shareholders for {ticker}: {e}")
         conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    import sys
    t = sys.argv[1] if len(sys.argv) > 1 else '130A'
    res = fetch_shareholders(t)
    print(f"Fetched {len(res)} shareholders for {t}.")
    print(res)
    save_shareholders(res)
    print("Saved to DB!")
