import sqlite3
import requests
from bs4 import BeautifulSoup
import re
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import get_db_connection

def parse_num(val_str):
    if not val_str or val_str in ['－', '-', '']:
        return 0.0
    # Special Kabutan strings
    if '赤転' in val_str or '黒転' in val_str or '赤拡' in val_str or '赤縮' in val_str:
        return 0.0
    val_clean = val_str.replace(',', '')
    try:
        return float(val_clean)
    except:
        return 0.0

def fetch_financials(ticker):
    url = f"https://kabutan.jp/stock/finance?code={ticker}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            return []
            
        soup = BeautifulSoup(res.content, 'html.parser')
        
        results = []
        
        # Kabutan's first table is generally the annual financial summary
        # Let's target the exact table by matching headers
        for t in soup.find_all('table'):
            header_text = t.find('tr').text if t.find('tr') else ""
            if '決算期' in header_text and '売上高' in header_text and '営業益' in header_text:
                rows = t.find_all('tr')
                # Index 0 is header, 1 might be empty line. Row data usually starts around 2 or 3
                for row in rows[1:]:
                    cells = row.find_all(['th', 'td'])
                    if len(cells) >= 6:
                        period_str = cells[0].text.strip()
                        if not period_str:
                            continue
                            
                        # Break out if we hit the '前年比' row
                        if '比' in period_str:
                            break
                            
                        is_forecast = 1 if '予' in period_str else 0
                        
                        # Extract YYYY.MM
                        match = re.search(r'([0-9]{4})\.([0-9]{2})', period_str)
                        if not match:
                            continue
                            
                        period_end = f"{match.group(1)}-{match.group(2)}"
                        
                        sales = parse_num(cells[1].text.strip())
                        op_profit = parse_num(cells[2].text.strip())
                        ord_profit = parse_num(cells[3].text.strip())
                        net_profit = parse_num(cells[4].text.strip())
                        eps = parse_num(cells[5].text.strip())
                        
                        results.append({
                            "ticker": ticker,
                            "period_type": "annual",
                            "period_end": period_end,
                            "sales": sales,
                            "operating_profit": op_profit,
                            "ordinary_profit": ord_profit,
                            "net_profit": net_profit,
                            "eps": eps,
                            "is_forecast": is_forecast
                        })
                # We only want the first table (Annual)
                break
        return results
    except Exception as e:
        print(f"Error fetching Kabutan financials for {ticker}: {e}")
        return []

def save_financials(data):
    if not data:
        return
        
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        for r in data:
            c.execute("""
                INSERT OR REPLACE INTO financial_stats 
                (ticker, period_type, period_end, sales, operating_profit, ordinary_profit, net_profit, eps, is_forecast, source, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'kabutan', CURRENT_TIMESTAMP)
            """, (
                r['ticker'], r['period_type'], r['period_end'],
                r['sales'], r['operating_profit'], r['ordinary_profit'], r['net_profit'], r['eps'], r['is_forecast']
            ))
            
        conn.commit()
    except Exception as e:
         print(f"Error saving financials: {e}")
         conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    test_data = fetch_financials("130A")
    print(f"Fetched: {test_data}")
    save_financials(test_data)
    print("Saved financials.")
