import os
import sqlite3
import pandas as pd
import requests
import io
from database import DB_NAME, init_db

JPX_URL = "https://www.jpx.co.jp/markets/statistics-equities/misc/01.html"

def get_db_connection():
    return sqlite3.connect(DB_NAME)

def recreate_companies_table(conn):
    c = conn.cursor()
    # Drop the old table if it exists
    c.execute("DROP TABLE IF EXISTS companies")
    
    # Recreate the table according to the modern schema
    c.execute('''
    CREATE TABLE companies (
        ticker TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        market TEXT,
        sector TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    conn.commit()

def fetch_and_populate_jpx_sectors():
    print(f"Fetching JPX Market List from: {JPX_URL}")
    
    res = requests.get(JPX_URL, headers={'User-Agent': 'Mozilla/5.0'})
    if res.status_code != 200:
        print("Failed to access JPX page.")
        return

    from bs4 import BeautifulSoup
    soup = BeautifulSoup(res.content, 'html.parser')
    link_tag = soup.find('a', href=lambda href: href and 'data_j.xls' in href)
    
    if not link_tag:
        print("Could not find data_j.xls link.")
        return

    xls_url = "https://www.jpx.co.jp" + link_tag['href']
    print(f"Downloading Excel: {xls_url}")

    xls_res = requests.get(xls_url, headers={'User-Agent': 'Mozilla/5.0'})
    if xls_res.status_code != 200:
        print("Failed to download Excel.")
        return

    # Parse with Pandas
    df = pd.read_excel(io.BytesIO(xls_res.content))
    
    print(f"Processing rows...")
    
    conn = get_db_connection()
    recreate_companies_table(conn)
    c = conn.cursor()
    
    updated_count = 0
    
    for index, row in df.iterrows():
        try:
            # Code column usually index 1, Name index 2, Market index 3, 33 Sector index 5
            code_raw = str(row.iloc[1])
            name = str(row.iloc[2])
            market_name = str(row.iloc[3])
            sector_name = str(row.iloc[5])
            
            import re
            # Look for normal standard equity tickers (4 digits or 4 alphanumeric)
            if len(code_raw) >= 4 and re.match(r'^[0-9A-Za-z]{4}$', code_raw[:4]):
                ticker = code_raw[:4]
                
                # Normalize market name
                market_clean = "Other"
                if "プライム" in market_name:
                    market_clean = "Prime"
                elif "スタンダード" in market_name:
                    market_clean = "Standard"
                elif "グロース" in market_name:
                    market_clean = "Growth"
                
                # Insert into exactly matching schema
                c.execute("""
                    INSERT INTO companies (ticker, name, market, sector, created_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(ticker) DO UPDATE SET
                        name=excluded.name,
                        market=excluded.market,
                        sector=excluded.sector
                """, (ticker, name, market_clean, sector_name))
                
                updated_count += 1
                    
        except Exception as e:
            continue

    conn.commit()
    conn.close()
    print(f"Updated {updated_count} companies with sector data.")

if __name__ == "__main__":
    init_db() # Ensure tables are ready (in case we start from scratch)
    fetch_and_populate_jpx_sectors()
