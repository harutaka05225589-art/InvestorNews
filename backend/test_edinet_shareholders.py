import os
import requests
import zipfile
import io
import re
from bs4 import BeautifulSoup
import datetime

# EDINET API Key setup
API_KEY = os.environ.get('EDINET_API_KEY', 'f438dea945154ea89f2bcbc8960d7b8e')

def get_recent_yuho_doc_id(ticker):
    """
    Finds a recent '有価証券報告書' (Annual Securities Report) docID for a ticker.
    EDINET API only allows searching by date, so we'll just search the last 30 days
    in hopes of finding one, or use a known recent docID for testing.
    Since we don't have a reliable mapping of Ticker -> EDINET Code here without the DB,
    we'll just use a direct document lookup if provided.
    """
    pass

def download_and_parse_xbrl(doc_id):
    """
    Downloads the EDINET document ZIP (type=1 for XBRL) and parses for shareholders.
    """
    url = f"https://api.edinet-fsa.go.jp/api/v2/documents/{doc_id}?type=1&Subscription-Key={API_KEY}"
    print(f"Downloading XBRL zip from EDINET for DocID: {doc_id}")
    
    # Using verify=False to bypass local SSL certificate issues with the FSA server
    import urllib3
    urllib3.disable_warnings()
    res = requests.get(url, verify=False)
    
    if res.status_code != 200:
        print(f"Failed to download. Status: {res.status_code}")
        print(res.text)
        return
        
    try:
        with zipfile.ZipFile(io.BytesIO(res.content)) as z:
            # We are looking for the .htm or .ixbrl files in XBRL/PublicDoc
            public_docs = [f for f in z.namelist() if f.startswith('XBRL/PublicDoc/') and f.endswith('.htm')]
            if not public_docs:
                print("No public document HTM files found in ZIP.")
                return
                
            print(f"Found {len(public_docs)} HTML/XBRL files. Parsing...")
            
            for doc_name in public_docs:
                with z.open(doc_name) as f:
                    html_content = f.read().decode('utf-8')
                    soup = BeautifulSoup(html_content, 'lxml') # Or html.parser if lxml fails
                    
                    # For many recent EDINET reports, the Major Shareholder table is NOT marked up with XBRL tags. 
                    # We must find the text "大株主の状況" and parse the next HTML table.
                    target = soup.find(string=re.compile('大株主の状況'))
                    if target:
                        table = target.find_next('table')
                        if table:
                            rows = table.find_all('tr')
                            if len(rows) > 1:
                                print(f"\n--- Extracted Shareholder Data from {doc_name} ---")
                                # Skip header row, parse data rows
                                for i, row in enumerate(rows[1:16]): # Top 10-15 usually
                                    cells = row.find_all('td')
                                    if len(cells) >= 4: # Expected: Name, Address, Shares, Ratio
                                        name = cells[0].get_text(strip=True).replace('\n', '')
                                        shares = cells[2].get_text(strip=True).replace('\n', '')
                                        ratio = cells[3].get_text(strip=True).replace('\n', '')
                                        
                                        if name and "計" not in name:
                                            print(f"{i+1:2d} | 割合: {ratio:>6} | 株式数: {shares:>10} | 株主名: {name}")
                                return True # Success
                                
                    print(f"Skipping {doc_name} - no shareholder table found.")
                    
        print("No shareholder tags found in any document in the ZIP.")
    except Exception as e:
         print(f"Error parsing ZIP: {e}")

if __name__ == "__main__":
    # Test DocID S100UJU5 (Mito Securities Group Yuho, Nov 2024)
    test_doc = "S100UJU5"
    download_and_parse_xbrl(test_doc)
