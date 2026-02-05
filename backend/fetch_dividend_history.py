import requests
from bs4 import BeautifulSoup
import re
import time
import sqlite3
from database import get_db_connection

def fetch_dividend_history(ticker):
    """
    Fetches dividend history (past 5+ years) from Kabutan.
    Returns a list of dicts: { "period": "2024.03", "amount": 100.0, "is_forecast": False }
    """
    url = f"https://kabutan.jp/stock/finance?code={ticker}&mode=d"
    print(f"Fetching dividend history for {ticker} from {url}")
    
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            print(f"  Error: Status {res.status_code}")
            return []
            
        soup = BeautifulSoup(res.content, "html.parser")
        
        # Look for the dividend table
        # Specifically, the main finance table or specific dividend table
        # Kabutan structure: table includes "配当" columns
        
        history = []
        
        # Find all tables
        tables = soup.find_all("table")
        
        target_table = None
        div_idx = -1
        period_idx = -1
        
        for table in tables:
            # Check header row
            rows = table.find_all("tr")
            if not rows: continue
            
            header_row = rows[0]
            headers_text = [c.get_text().strip() for c in header_row.find_all(["th", "td"])]
            
            # Look for "決算期" (Period) and "配当" (Dividend)
            p_idx = -1
            d_idx = -1
            for i, h in enumerate(headers_text):
                if "決算期" in h:
                    p_idx = i
                if "配当" in h:
                    d_idx = i
            
            if p_idx != -1 and d_idx != -1:
                target_table = table
                div_idx = d_idx
                period_idx = p_idx
                print(f"  [DEBUG] Found Table. PeriodCol={p_idx}, DivCol={d_idx}")
                break
        
        if not target_table:
            print("  Dividend table not found.")
            return []

        rows = target_table.find_all("tr")
        
        # Parse Rows
        for i, row in enumerate(rows[1:]): # Skip header
            cols = row.find_all(["td", "th"])
            if len(cols) <= div_idx:
                continue
                
            period_text = cols[period_idx].get_text().strip()
            div_text = cols[div_idx].get_text().strip()
            
            # Debug first few rows
            if i < 3:
                print(f"  [DEBUG] Row {i}: Period='{period_text}', Div='{div_text}'")

            # Check if Forecast (予)
            is_forecast = "予" in period_text or "予" in div_text
            
            # Clean Period (2024.03) / Remove '連' '単' etc
            # Keep digits and dots and slashes
            period_clean = re.sub(r'[^\d\./]', '', period_text)
            
            # Clean Amount
            try:
                if not div_text or div_text == "－":
                    amount = 0.0
                else:
                    amount = float(re.sub(r'[^\d\.]', '', div_text))
            except:
                continue
            
            # Relaxed length check (YY.MM is 5 chars, YY/MM is 5 chars)
            # 24.03 -> 5 chars
            if period_clean and len(period_clean) >= 3: 
                # Normalize YY.MM to 20YY.MM if needed?
                # For now let's just save it.
                history.append({
                    "period": period_clean,
                    "amount": amount,
                    "is_forecast": is_forecast
                })

                
        return history

    except Exception as e:
        print(f"  Fetch Error: {e}")
        return []

def save_history(ticker, history):
    conn = get_db_connection()
    c = conn.cursor()
    
    count = 0
    for h in history:
        # Check if exists
        c.execute("""
            INSERT INTO dividend_history (ticker, period, dividend_amount, is_forecast)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(ticker, period) DO UPDATE SET
                dividend_amount=excluded.dividend_amount,
                is_forecast=excluded.is_forecast
        """, (ticker, h['period'], h['amount'], h['is_forecast']))
        count += 1
        
    conn.commit()
    conn.close()
    print(f"  Saved {count} records for {ticker}.")

if __name__ == "__main__":
    # Test
    # save_history("7203", fetch_dividend_history("7203"))
    pass
