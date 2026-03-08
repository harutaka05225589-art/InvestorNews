import os
import requests
import zipfile
import io
import re
from bs4 import BeautifulSoup
import datetime
import sqlite3
from dotenv import load_dotenv

# Setup paths and environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'frontend', 'investor_news.db')
ENV_PATH = os.path.join(BASE_DIR, 'backend', '.env')

load_dotenv(ENV_PATH, override=True)
API_KEY = os.environ.get('EDINET_API_KEY', 'f438dea945154ea89f2bcbc8960d7b8e')

# Disable SSL Warnings for FSA API
import urllib3
urllib3.disable_warnings()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def fetch_daily_edinet_yuhos(target_date_str=None):
    """
    Fetches the list of Annual Securities Reports (有価証券報告書 - DocTypeCode 120)
    submitted to EDINET on a specific date.
    Returns: list of dicts [{docID, filerName, secCode}]
    """
    if not target_date_str:
        # Default to today JST
        jst_now = datetime.datetime.utcnow() + datetime.timedelta(hours=9)
        target_date_str = jst_now.strftime('%Y-%m-%d')
        
    url = f"https://api.edinet-fsa.go.jp/api/v2/documents.json?date={target_date_str}&type=2&Subscription-Key={API_KEY}"
    print(f"Fetching EDINET document list for {target_date_str}...")
    
    try:
        res = requests.get(url, verify=False, timeout=15)
        if res.status_code != 200:
            print(f"Failed to fetch document list. Status: {res.status_code}")
            return []
            
        data = res.json()
        results = data.get('results', [])
        
        yuhos = []
        for doc in results:
            # docTypeCode '120' is 有価証券報告書 (Annual Securities Report)
            if doc.get('docTypeCode') == '120':
                # EDINET secCode includes a trailing 0 (e.g., Toyota 7203 is 72030)
                sec_code = str(doc.get('secCode'))[:-1] if doc.get('secCode') else None
                if sec_code: # Only process listed companies with a standard 4-digit ticker
                    yuhos.append({
                        'docID': doc.get('docID'),
                        'filerName': doc.get('filerName'),
                        'ticker': sec_code
                    })
        print(f"Found {len(yuhos)} Annual Securities Reports for listed companies.")
        return yuhos
    except Exception as e:
        print(f"Error fetching document list: {e}")
        return []

def download_and_parse_xbrl(doc_id):
    """
    Downloads the EDINET document ZIP (type=1 for XBRL) and parses for shareholders
    using BeautifulSoup to find the '大株主の状況' HTML table.
    Returns: List of dicts [{"name": str, "ratio": float, "count": str}]
    """
    url = f"https://api.edinet-fsa.go.jp/api/v2/documents/{doc_id}?type=1&Subscription-Key={API_KEY}"
    print(f"  DL XBRL DocID: {doc_id}")
    
    try:
        res = requests.get(url, verify=False, timeout=20)
        if res.status_code != 200:
            print(f"    Failed to download ZIP. Status: {res.status_code}")
            return []
            
        shareholders_result = []
        with zipfile.ZipFile(io.BytesIO(res.content)) as z:
            public_docs = [f for f in z.namelist() if f.startswith('XBRL/PublicDoc/') and f.endswith('.htm')]
            
            for doc_name in public_docs:
                with z.open(doc_name) as f:
                    html_content = f.read().decode('utf-8')
                    soup = BeautifulSoup(html_content, 'lxml')
                    
                    target = soup.find(string=re.compile('大株主の状況'))
                    if target:
                        table = target.find_next('table')
                        if table:
                            rows = table.find_all('tr')
                            if len(rows) > 1:
                                # Top 10-15 usually
                                for row in rows[1:16]:
                                    cells = row.find_all('td')
                                    if len(cells) >= 4:
                                        name = cells[0].get_text(strip=True).replace('\n', '')
                                        shares_str = cells[2].get_text(strip=True).replace('\n', '')
                                        ratio_str = cells[3].get_text(strip=True).replace('\n', '')
                                        
                                        if not name or "計" in name:
                                            continue
                                            
                                        # Parse Ratio
                                        try:
                                            # "15.23" -> float
                                            clean_ratio = re.sub(r'[^0-9.]', '', ratio_str)
                                            ratio = float(clean_ratio) if clean_ratio else 0.0
                                        except:
                                            ratio = 0.0
                                            
                                        shareholders_result.append({
                                            "name": name,
                                            "count": shares_str,
                                            "ratio": ratio
                                        })
                                return shareholders_result # Success, extracted from this file
        return shareholders_result
    except Exception as e:
         print(f"    Error parsing ZIP {doc_id}: {e}")
         return []

def run_daily_edinet_shareholder_update(target_date=None):
    if not target_date:
       target_date = (datetime.datetime.utcnow() + datetime.timedelta(hours=9)).strftime('%Y-%m-%d')
       
    if not API_KEY:
        print("Error: EDINET_API_KEY not found in backend/.env")
        return

    print(f"--- Starting Daily EDINET Shareholder Update: {target_date} ---")
    
    yuhos = fetch_daily_edinet_yuhos(target_date)
    if not yuhos:
        print("No reports to process today.")
        return
        
    conn = get_db_connection()
    c = conn.cursor()
    
    success_count = 0
    
    for doc in yuhos:
        ticker = doc['ticker']
        doc_id = doc['docID']
        filer_name = doc['filerName']
        
        # Check if we already track this company
        valid_comp = c.execute("SELECT 1 FROM companies WHERE code = ?", (ticker,)).fetchone()
        if not valid_comp:
            continue # We only care about tracking shareholders for companies in our DB
            
        print(f"\nProcessing {ticker} ({filer_name}) - DocID: {doc_id}")
        shareholders = download_and_parse_xbrl(doc_id)
        
        if shareholders:
            # Overwrite today's entry if it exists (idempotent), but keep history for other dates
            c.execute("DELETE FROM stock_shareholders WHERE ticker = ? AND entry_date = ?", (ticker, target_date))
            
            for i, sh in enumerate(shareholders):
                c.execute('''
                    INSERT INTO stock_shareholders (ticker, entry_date, shareholder_name, share_count, share_ratio, rank)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (ticker, target_date, sh['name'], sh['count'], sh['ratio'], i+1))
                
            conn.commit()
            print(f"  Saved {len(shareholders)} shareholders to DB.")
            success_count += 1
        else:
            print("  No shareholder data found/extracted.")
            
    conn.close()
    print(f"\n--- EDINET Update Complete ---")
    print(f"Successfully updated shareholder data for {success_count} companies.")

if __name__ == "__main__":
    # If run manually, process from argv 1 if provided, else today
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else None
    run_daily_edinet_shareholder_update(target)
