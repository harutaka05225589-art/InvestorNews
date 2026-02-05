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
        
        # Determine table structure
        # Often it's in <div id="finance_box"> ... <table>
        div_box = soup.find("div", id="finance_box")
        if not div_box:
            print("  Table container not found.")
            return []
            
        rows = div_box.find_all("tr")
        
        # Header parsing to find dividend column index
        # Usually: 決算期 | ... | 1株配当
        header_row = rows[0]
        headers_text = [th.get_text().strip() for th in header_row.find_all(["th", "td"])]
        
        div_idx = -1
        period_idx = 0
        
        for i, h in enumerate(headers_text):
            if "１株配当" in h:
                div_idx = i
                break
        
        if div_idx == -1:
            print("  Dividend column not found.")
            return []
            
        # Parse Rows
        for row in rows[1:]: # Skip header
            cols = row.find_all(["td", "th"])
            if len(cols) <= div_idx:
                continue
                
            period_text = cols[period_idx].get_text().strip()
            div_text = cols[div_idx].get_text().strip()
            
            # Check if Forecast (予)
            is_forecast = "予" in period_text or "予" in div_text
            
            # Clean Period (2024.03) / Remove '連' '単' etc
            # Keep YYYY.MM
            period_clean = re.sub(r'[^\d\.]', '', period_text)
            
            # Clean Amount
            try:
                if not div_text or div_text == "－":
                    amount = 0.0
                else:
                    amount = float(re.sub(r'[^\d\.]', '', div_text))
            except:
                continue
                
            if period_clean and len(period_clean) >= 6: # Basic check
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
