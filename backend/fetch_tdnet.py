import requests
from bs4 import BeautifulSoup
import datetime
import sqlite3
import os
import re
import time
from database import get_db_connection

# TDnet Public URL Pattern
# YYYYMMDD format
TDNET_LIST_URL = "https://www.release.tdnet.info/inbs/I_list_001_{}.html"

def fetch_tdnet_revisions(target_date=None, trigger_ai=True):
    if not target_date:
        target_date = datetime.datetime.now()
    
    date_str = target_date.strftime('%Y%m%d')
    url = TDNET_LIST_URL.format(date_str)
    
    print(f"Fetching TDnet for {date_str}: {url}")
    
    try:
        res = requests.get(url, timeout=10)
        if res.status_code != 200:
            print(f"  TDnet fetch failed: {res.status_code}")
            return
        
        soup = BeautifulSoup(res.content, 'html.parser')
        
        conn = get_db_connection()
        c = conn.cursor()
        
        count = 0
        
        rows = soup.find_all('tr')
        print(f"  [DEBUG] Found {len(rows)} rows in HTML")
        
        for i, row in enumerate(rows):
            cols = row.find_all('td')
            if i < 3:
                 print(f"  [DEBUG] Row {i}: {len(cols)} columns. Content: {[c.get_text().strip()[:20] for c in cols]}")

            if len(cols) < 4:
                continue
            try:
                code_text = cols[1].get_text().strip()
                name_text = cols[2].get_text().strip()
                title_text = cols[3].get_text().strip()
                
                pdf_link = None
                a_tag = cols[3].find('a')
                if a_tag:
                    pdf_link = "https://www.release.tdnet.info/inbs/" + a_tag['href']
                
                if any(k in title_text for k in ["業績予想の修正", "差異", "配当", "剰余金の処分", "自己株式", "決算短信"]):
                    if "自己株式" in title_text and any(skip in title_text for skip in ["取得状況", "取得結果", "完了"]):
                        continue
                    ticker = code_text[:4]
                    
                    print(f"  Found Revision: {ticker} {name_text} - {title_text}")
                    
                    category = 'general'
                    is_earnings = any(k in title_text for k in ['業績', '修正', '差異', '決算短信'])
                    is_dividend = any(k in title_text for k in ['配当', '剰余金'])
                    is_buyback = '自己株式' in title_text

                    if is_earnings and is_dividend:
                        category = 'both'
                    elif is_earnings:
                        category = 'earnings'
                    elif is_dividend:
                        category = 'dividend'
                    elif is_buyback:
                        category = 'buyback'

                    c.execute("""
                        INSERT INTO revisions 
                        (ticker, company_name, revision_date, source_url, quarter, title, category)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(ticker, revision_date) DO UPDATE SET
                            title=excluded.title,
                            company_name=excluded.company_name,
                            source_url=excluded.source_url,
                            category=excluded.category
                    """, (
                        ticker, 
                        name_text, 
                        target_date.strftime('%Y-%m-%d'),
                        pdf_link,
                        "Unknown",
                        title_text,
                        category
                    ))
                    
                    if c.rowcount > 0:
                        count += 1
                        print(f"    -> New Revision Saved.")
                        
                        try:
                            c.execute("""
                                INSERT INTO companies (ticker, name, market, sector, created_at)
                                VALUES (?, ?, 'TDnet', '', CURRENT_TIMESTAMP)
                                ON CONFLICT(ticker) DO UPDATE SET
                                    name=excluded.name,
                                    market=excluded.market
                            """, (ticker, name_text))
                        except Exception as e_comp:
                            print(f"    Warning: Could not auto-add to companies table: {e_comp}")
            
            except Exception as e:
                continue
            
        conn.commit()
        conn.close()
        print(f"  Saved {count} revision events.")

        if trigger_ai:
            try:
                from analyze_revisions_ai import process_revisions
                print("--- Starting AI Analysis for new revisions ---")
                process_revisions()
                print("--- AI Analysis Completed ---")
            except Exception as e:
                print(f"Error during AI Analysis trigger: {e}")
        
    except Exception as e:
        print(f"Error fetching TDnet: {e}")

if __name__ == "__main__":
    today = datetime.datetime.now()
    for i in range(7):
        d = today - datetime.timedelta(days=i)
        fetch_tdnet_revisions(target_date=d, trigger_ai=False)
        time.sleep(1)

    print("\nBatch fetch complete. Triggering AI Analysis...")
    from analyze_revisions_ai import process_revisions
    process_revisions()
