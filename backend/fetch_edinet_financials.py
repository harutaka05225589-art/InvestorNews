import requests
import datetime
import os
import zipfile
import io
import time
from bs4 import BeautifulSoup

# --- CONFIG ---
# Get API Key from Environment or use provided key
API_KEY = os.environ.get('EDINET_API_KEY', 'f438dea945154ea89f2bcbc8960d7b8e')
TYPE = 2 # 1=Metadata, 2=PDF+XBRL (Wait, Type=2 is List, but we need Type=1 for Financials? No.
# API v2:
# /documents.json : type=1 (Metadata only?), type=2 (PDF/XBRL available?)
# Actually /documents.json type=2 includes list of docs.
# Then /documents/{docID} type=1 -> XBRL zip. type=2 -> PDF.
# Let's check existing fetch_edinet.py: type=2 used for list.

def fetch_edinet_financial_list(date_str):
    url = f"https://disclosure.edinet-fsa.go.jp/api/v2/documents.json?date={date_str}&type=2&Subscription-Key={API_KEY}"
    print(f"Fetching EDINET list for {date_str}...")
    
    try:
        res = requests.get(url, timeout=30)
        if res.status_code == 200:
            data = res.json()
            return data.get('results', [])
        else:
            print(f"Failed to fetch list: {res.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching list: {e}")
        return []

def download_and_parse_xbrl(doc_id):
    # Download XBRL Zip (type=1)
    url = f"https://disclosure.edinet-fsa.go.jp/api/v2/documents/{doc_id}?type=1&Subscription-Key={API_KEY}"
    print(f"Downloading XBRL for {doc_id}...")
    
    try:
        res = requests.get(url, timeout=60)
        if res.status_code != 200:
            print(f"  Failed to download XBRL: {res.status_code}")
            return None
        
        # Zip handling
        with zipfile.ZipFile(io.BytesIO(res.content)) as z:
            # Find the .xbrl file (PublicDoc)
            # Structure usually: XBRL/PublicDoc/*.xbrl
            xbrl_file = None
            for name in z.namelist():
                if "PublicDoc" in name and name.endswith(".xbrl"):
                    xbrl_file = name
                    break
            
            if not xbrl_file:
                print("  No public XBRL file found in zip.")
                return None
            
            print(f"  Parsing {xbrl_file}...")
            with z.open(xbrl_file) as f:
                soup = BeautifulSoup(f, 'xml') # Use XML parser
                
                # Extract Key Financials (J-GAAP tags usually)
                # Namespaces can be tricky.
                
                # Example Tags (Consolidated):
                # NetSales, OperatingIncome, OrdinaryIncome, ProfitAttributableToOwnersOfParent
                # EPS: BasicEarningsPerShare
                
                # We search by "local name" to avoid namespace hell for now
                
                def get_val(tag_name, context_ref="CurrentYearInstant"): 
                    # ContextRef is hard to guess (CurrentYearDuration, CurrentYearInstant, etc.)
                    # Strategy: Find all tags, prioritize "CurrentYearDuration" (for P&L)
                    
                    tags = soup.find_all(re.compile(tag_name, re.IGNORECASE))
                    if not tags: return None
                    
                    # Filter for 'CurrentYear' context if possible
                    # Context definitions are in <xbrli:context id="...">
                    # Usually "CurrentYearDuration" (for P&L) and "CurrentYearInstant" (for BS)
                    
                    # Simplification: Look for the value that is Numeric and not empty
                    for t in tags:
                        # Check contextRef attribute
                        ctx = t.get('contextRef', '')
                        if 'CurrentYearDuration' in ctx or 'CurrentYearInstant' in ctx:
                             val = t.get_text().strip()
                             if val: return val
                    
                    # Fallback: take first non-empty
                    for t in tags:
                        if t.get_text().strip(): return t.get_text().strip()
                    
                    return None

                import re
                
                data = {}
                data['sales'] = get_val('NetSales') or get_val('OperatingRevenue1') # Sales or Revenue
                data['operating_profit'] = get_val('OperatingIncome')
                data['ordinary_profit'] = get_val('OrdinaryIncome')
                data['net_profit'] = get_val('ProfitAttributableToOwnersOfParent')
                data['eps'] = get_val('BasicEarningsPerShare')
                
                print(f"  Extracted: {data}")
                return data

    except Exception as e:
        print(f"Error parsing XBRL: {e}")
        return None

if __name__ == "__main__":
    # Test Run: Search backwards up to 7 days to find a report
    today = datetime.date.today()
    found_any = False
    
    for i in range(1, 8):
        date_str = (today - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
        print(f"\n--- Checking {date_str} ---")
        
        docs = fetch_edinet_financial_list(date_str)
        if not docs:
            print("  No docs found.")
            continue
            
        # Filter for a Financial Report (Yuho/Tanshin)
        # We want to find a standard company to verify tags (NetSales etc)
        # Investment Trusts (like Fidelity) have different tags.
        
        candidates = []
        for d in docs:
            code = d.get('docTypeCode', '')
            # 120: Yuho, 130: Quarterly, 140: Tanshin
            if code == '120' or code == '130' or code == '140':
                candidates.append(d)
        
        print(f"  Found {len(candidates)} financial report candidates.")
        
        # Try up to 3 candidates, preferably with a secCode (Ticker)
        count = 0
        for d in candidates:
            sec_code = d.get('secCode')
            submitter = d.get('filerName')
            
            # Skip Investment Trusts/Funds if possible (heuristics)
            if '投信' in submitter or 'ファンド' in submitter:
                continue
                
            # If secCode is missing, it's likely unlisted or fund
            if not sec_code:
                continue
                
            print(f"  Testing: {submitter} ({sec_code}) - {d.get('docDescription')}")
            
            result = download_and_parse_xbrl(d.get('docID'))
            if result:
                if result.get('sales') or result.get('net_profit'):
                    print(f"  !!! SUCCESS !!! Found valid financial data.")
                    found_any = True
                    break # Success!
                else:
                    print("  Parsed, but key fields were empty (might be specific accounting standard).")
            
            count += 1
            if count >= 3: break # Don't spam too much
            
        if found_any: break
            
    if not found_any:
        print("\nCould not find any standard financial reports with parseable Sales/Profit in the last 7 days.")
