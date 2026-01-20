import requests
from bs4 import BeautifulSoup
import pandas as pd
import sqlite3
import os
import io

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')
JPX_URL = "https://www.jpx.co.jp/markets/statistics-equities/misc/01.html"

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def fetch_and_update_markets():
    print(f"Fetching JPX Market List from: {JPX_URL}")
    
    try:
        # 1. Scrape page to find the Excel link
        res = requests.get(JPX_URL, headers={'User-Agent': 'Mozilla/5.0'})
        if res.status_code != 200:
            print("Failed to access JPX page.")
            return

        soup = BeautifulSoup(res.content, 'html.parser')
        # Find link ending with .xls and containing "data_j"
        link_tag = soup.find('a', href=lambda href: href and 'data_j.xls' in href)
        
        if not link_tag:
            print("Could not find data_j.xls link.")
            # Fallback or manual URL if needed, but usually it's there
            return

        xls_url = "https://www.jpx.co.jp" + link_tag['href']
        print(f"Downloading Excel: {xls_url}")

        # 2. Download Excel
        xls_res = requests.get(xls_url, headers={'User-Agent': 'Mozilla/5.0'})
        if xls_res.status_code != 200:
            print("Failed to download Excel.")
            return

        # 3. Parse with Pandas
        df = pd.read_excel(io.BytesIO(xls_res.content))
        
        # Columns often: [日付, コード, 銘柄名, 市場・商品区分, 33業種コード, 33業種区分, 17業種コード, 17業種区分, 規模コード, 規模区分]
        # We need "コード" (Code) and "市場・商品区分" (Market Segment)
        
        # Identify columns
        # Code column usually index 1, Market index 3
        # Let's inspect columns or assume standard format
        # Filter for rows where 'コード' is numeric
        
        print(f"Processing {len(df)} rows...")
        
        conn = get_db_connection()
        c = conn.cursor()
        
        updated_count = 0
        
        for index, row in df.iterrows():
            try:
                code_raw = str(row.iloc[1]) # Column 1: Code
                market_name = str(row.iloc[3]) # Column 3: Market Segment
                
                # Check if it looks like a ticker (4 digits or 5)
                # JPX codes are like 13010. We use 1301.
                if len(code_raw) >= 4:
                    ticker = code_raw[:4] # Take first 4 chars
                    
                    # Normalize market name
                    # "プライム（内国株）" -> "Prime"
                    # "スタンダード（内国株）" -> "Standard"
                    # "グロース（内国株）" -> "Growth"
                    market_clean = "Other"
                    if "プライム" in market_name:
                        market_clean = "Prime"
                    elif "スタンダード" in market_name:
                        market_clean = "Standard"
                    elif "グロース" in market_name:
                        market_clean = "Growth"
                    
                    # Update DB
                    c.execute("UPDATE ir_events SET market = ? WHERE ticker = ?", (market_clean, ticker))
                    if c.rowcount > 0:
                        updated_count += c.rowcount
                        
            except Exception as e:
                continue

        conn.commit()
        conn.close()
        print(f"Market segments updated for {updated_count} event records.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_and_update_markets()
