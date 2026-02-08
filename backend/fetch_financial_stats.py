import requests
from bs4 import BeautifulSoup
import re
import time
import sqlite3
from database import get_db_connection

def fetch_financial_stats(ticker):
    """
    Fetches annual and quarterly financial stats from Kabutan.
    Returns: list of dicts
    """
    url = f"https://kabutan.jp/stock/finance?code={ticker}&mode=k"
    print(f"Fetching financial stats for {ticker} from {url}")
    
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        # Timeout: (connect, read)
        res = requests.get(url, headers=headers, timeout=(5, 10))
        if res.status_code != 200:
            print(f"  Error: Status {res.status_code}")
            return []
            
        soup = BeautifulSoup(res.content, "html.parser")
        tables = soup.find_all("table")
        
        results = []
        
        for i_table, table in enumerate(tables):
            rows = table.find_all("tr")
            if not rows: continue
            
            header_text = rows[0].get_text().strip().replace("\n", " ")
            
            # Check preceding header for table type
            # Removed "div" to avoid matching table wrappers and masking headers
            prev = table.find_previous(["h2", "h3", "caption"])
            prev_text = prev.get_text().strip() if prev else ""
            
            # Parse Headers First to find Date Column
            h_cols = [c.get_text().strip() for c in rows[0].find_all(["th", "td"])]
            idx_map = {}
            for i_col, h in enumerate(h_cols):
                if "決算期" in h: idx_map['period'] = i_col
                elif "売上高" in h: idx_map['sales'] = i_col
                elif "営業益" in h: idx_map['op'] = i_col
                elif "経常益" in h: idx_map['ord'] = i_col
                elif "最終益" in h: idx_map['net'] = i_col
                elif "修正1株益" in h or "１株益" in h: idx_map['eps'] = i_col
            
            # Strict Column Check to avoid Sales/Profitability redundant tables
            # Annual/Quarter tables MUST have Net Profit (Profitability table has ROE/Margin instead)
            if 'period' not in idx_map or 'sales' not in idx_map or 'net' not in idx_map:
                continue

            # Determine Table Type
            period_type = None
            
            # Explicit Preceding Header Check
            if "3ヵ月" in prev_text or "四半期" in prev_text:
                 period_type = 'quarter'
            elif "業績推移" in prev_text or "通期" in prev_text:
                 period_type = 'annual'
            # Fallback: Check header row text
            elif "四半期" in header_text or "３ヵ月" in header_text:
                 period_type = 'quarter'
            elif "通期" in header_text:
                 period_type = 'annual'
            else:
                # Fallback Heuristic using Date Column
                # Scan rows until we find a valid date
                found_valid_date = False
                for r_idx in range(1, min(6, len(rows))):
                    cols = rows[r_idx].find_all(["td", "th"])
                    if len(cols) > idx_map['period']:
                        date_txt = cols[idx_map['period']].get_text().strip()
                        if not date_txt or date_txt == "－":
                            continue
                        
                        found_valid_date = True
                        if "-" in date_txt: # e.g. 23.04-06
                            period_type = 'quarter'
                        else: # e.g. 2024.03 or 2024.03
                            period_type = 'annual'
                        break
                
                if not found_valid_date:
                    # Default to annual if no date found (or maybe skip?)
                    # If we can't determine type, usually safer to skip or assume annual
                    # But checking structure: usually "Year.Month" implies annual.
                    period_type = 'annual'
            
            if not period_type:
                continue

            for row in rows[1:]:
                cols = row.find_all(["td", "th"])
                if len(cols) <= max(idx_map.values()): continue
                
                period_text = cols[idx_map['period']].get_text().strip()
                if not period_text or period_text == "－": continue
                
                # Check for Forecast
                is_forecast = "予" in period_text
                
                # Clean Period
                # Annual: 2024.03 -> 2024-03
                # Quarter: 23.04-06 -> 2023-06 (Use End Date for easier sorting)
                period_end = period_text.replace("予", "").replace("連結", "").replace("単独", "").strip()
                
                if period_type == 'annual':
                    # 24.03 -> 2024-03
                    # 2024.03 -> 2024-03
                    m = re.search(r'(\d{2,4})\.(\d{2})', period_end)
                    if m:
                        year, month = m.groups()
                        if len(year) == 2: year = "20" + year
                        period_end = f"{year}-{month}"
                    else:
                        continue # Skip invalid format
                elif period_type == 'quarter':
                    # 23.04-06 -> 2023-06 (End month)
                    # 24.01-03 -> 2024-03
                    m = re.search(r'(\d{2})\.(\d{2})-(\d{2})', period_end)
                    if m:
                        year, start_m, end_m = m.groups()
                        year = "20" + year
                        # Special case: if end month is smaller than start, it crossed year? usually no, fiscal quarters fit in calendar.
                        # Wait, what if it's 23.10-12?
                        # Whatever year is shown is the year of the start month.
                        # If start=10, end=12 -> Same year.
                        # If start=01, end=03 -> Same year.
                        # Kabutan convention: 24.01-03 means Jan-Mar 2024.
                        period_end = f"{year}-{end_m}"
                    else:
                        continue
                
                def parse_val(idx):
                    if idx is None: return 0.0
                    if idx >= len(cols): return 0.0
                    txt = cols[idx].get_text().strip()
                    if txt == "－" or not txt: return 0.0
                    
                    # Handle negative symbols (▲, −)
                    txt = txt.replace("▲", "-").replace("−", "-") # Replace full-width minus if any
                    
                    try:
                        # Remove everything except digits, minus, dot
                        val_str = re.sub(r'[^\d\.-]', '', txt)
                        return float(val_str)
                    except:
                        return 0.0

                sales = parse_val(idx_map.get('sales'))
                op = parse_val(idx_map.get('op'))
                ord_p = parse_val(idx_map.get('ord'))
                net = parse_val(idx_map.get('net'))
                eps = parse_val(idx_map.get('eps'))
                
                results.append({
                    "ticker": ticker,
                    "period_type": period_type,
                    "period_end": period_end,
                    "sales": sales,
                    "operating_profit": op,
                    "ordinary_profit": ord_p,
                    "net_profit": net,
                    "eps": eps,
                    "is_forecast": is_forecast,
                    "source": "kabutan"
                })
        
        return results

    except Exception as e:
        print(f"  Fetch Error: {e}")
        return []

def save_financial_stats(stats):
    if not stats: return
    conn = get_db_connection()
    c = conn.cursor()
    
    count = 0
    for s in stats:
        c.execute("""
            INSERT INTO financial_stats 
            (ticker, period_type, period_end, sales, operating_profit, ordinary_profit, net_profit, eps, is_forecast, source, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(ticker, period_type, period_end) DO UPDATE SET
                sales=excluded.sales,
                operating_profit=excluded.operating_profit,
                ordinary_profit=excluded.ordinary_profit,
                net_profit=excluded.net_profit,
                eps=excluded.eps,
                is_forecast=excluded.is_forecast,
                updated_at=CURRENT_TIMESTAMP
        """, (s['ticker'], s['period_type'], s['period_end'], s['sales'], s['operating_profit'], s['ordinary_profit'], s['net_profit'], s['eps'], s['is_forecast'], s['source']))
        count += 1
        
    conn.commit()
    conn.close()
    print(f"  Saved {count} financial records.")

if __name__ == "__main__":
    ticker = "7203"
    data = fetch_financial_stats(ticker)
    save_financial_stats(data)
