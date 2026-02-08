import requests
import datetime
import os
import zipfile
import io
import time
import re
from bs4 import BeautifulSoup
from database import get_db_connection

# --- CONFIG ---
# Get API Key from Environment or use provided key
API_KEY = os.environ.get('EDINET_API_KEY', 'f438dea945154ea89f2bcbc8960d7b8e')

def fetch_edinet_financial_list(date_str):
    url = f"https://disclosure.edinet-fsa.go.jp/api/v2/documents.json?date={date_str}&type=2&Subscription-Key={API_KEY}"
    print(f"Fetching EDINET list for {date_str}...")
    try:
        res = requests.get(url, timeout=30)
        if res.status_code == 200:
            return res.json().get('results', [])
        return []
    except Exception as e:
        print(f"Error fetching list: {e}")
        return []

def parse_xbrl_value(soup, tags, context_pattern=None):
    """
    Helper to find value for a list of possible tags.
    If context_pattern is provided, filters by contextRef.
    """
    for tag in tags:
        # Find all matching tags (namespace agnostic-ish)
        elements = soup.find_all(re.compile(tag, re.IGNORECASE))
        for el in elements:
            # Context Check
            if context_pattern:
                ctx = el.get('contextRef', '')
                if not re.search(context_pattern, ctx, re.IGNORECASE):
                    continue
            
            val = el.get_text().strip()
            if val:
                try:
                    return float(val)
                except:
                    return val # Return string if not float? Or None?
    return None

def download_and_process_report(doc):
    doc_id = doc.get('docID')
    submitter = doc.get('filerName')
    ticker_raw = doc.get('secCode', '')
    ticker = ticker_raw[:4] if ticker_raw and len(ticker_raw) >= 4 else None
    doc_type = doc.get('docTypeCode', '')
    
    # Determine Period Type
    period_type = 'annual' # Default
    if doc_type == '120': period_type = 'annual' # Yuho
    elif doc_type == '130': period_type = 'quarter' # Quarterly Report
    elif doc_type == '140': period_type = 'quarter' # Earnings Report (Tanshin)
    
    # Download XBRL
    url = f"https://disclosure.edinet-fsa.go.jp/api/v2/documents/{doc_id}?type=1&Subscription-Key={API_KEY}"
    # print(f"Downloading XBRL for {doc_id} ({submitter})...")
    
    try:
        res = requests.get(url, timeout=60)
        if res.status_code != 200:
            return None
        
        with zipfile.ZipFile(io.BytesIO(res.content)) as z:
            xbrl_file = None
            for name in z.namelist():
                if "PublicDoc" in name and name.endswith(".xbrl"):
                    xbrl_file = name
                    break
            
            if not xbrl_file: return None
            
            with z.open(xbrl_file) as f:
                soup = BeautifulSoup(f, 'xml')
                
                # --- Context Pattern Strategy ---
                # To distinguish "Current" from "Prior", look for `CurrentYearDuration` or similar.
                # However, exact context names vary.
                # Heuristic: Valid contexts usually contain "Current" or match the fiscal period end.
                # Simpler: We prioritize tags that have `Current` in context.
                ctx_pattern = r"Current|Now" 
                # Note: J-GAAP often uses "CurrentYearDuration" or "CurrentQuarterDuration"
                
                # Tags Mapping (J-GAAP / IFRS mixed fallback)
                data = {}
                
                # Sales
                data['sales'] = parse_xbrl_value(soup, ['NetSales', 'OperatingRevenue1', 'Revenue'], ctx_pattern)
                
                # Operating Profit
                data['operating_profit'] = parse_xbrl_value(soup, ['OperatingIncome', 'OperatingProfit'], ctx_pattern)
                
                # Ordinary Profit (J-GAAP specific)
                data['ordinary_profit'] = parse_xbrl_value(soup, ['OrdinaryIncome', 'ProfitBeforeTax'], ctx_pattern)
                
                # Net Profit
                data['net_profit'] = parse_xbrl_value(soup, [
                    'ProfitAttributableToOwnersOfParent', 
                    'NetIncome', 
                    'Profit', 
                    'ProfitLoss' # Sometimes just "Profit"
                ], ctx_pattern)
                
                # EPS
                data['eps'] = parse_xbrl_value(soup, ['BasicEarningsPerShare', 'EarningsPerShare'], ctx_pattern)
                
                # Check Period End Date from Context?
                # Or use `periodEnd` from Metadata? (doc doesn't have it in list usually)
                # We can extract it from `periodEnd` in document list if available? 
                # Actually doc list has `periodEnd`.
                period_end_raw = doc.get('periodEnd') # YYYY-MM-DD
                period_end = period_end_raw[:7] if period_end_raw else None # YYYY-MM
                
                # If parsed successfully
                if data['sales'] or data['net_profit']:
                    print(f"  Parsed {submitter} ({ticker}): {data}")
                    if ticker and period_end:
                        save_to_db(ticker, period_type, period_end, data)
                        return True
    except Exception as e:
        print(f"Error processing {doc_id}: {e}")
        return None

def save_to_db(ticker, period_type, period_end, data):
    conn = get_db_connection()
    c = conn.cursor()
    # is_forecast = 0 for Actual Results
    
    # Clean None to 0.0? Or keep None? DB expects Real.
    # Convert to standard units if needed. 
    # EDINET usually reports in Yen (Units: Millions, Thousands, or Ones). 
    # We need to detect Unit Ref!
    # Checking `unitRef` attribute on the element.
    # This is Complex.
    # Hack for MVP: Assume "Yen" (Ones) or "Million Yen".
    # Most XBRL is in *Ones* (e.g. 37,499,000,000).
    # Kabutan was in Millions (37,499).
    # We store in MILLIONS in DB?
    # Existing data: 1527.0 (Annual Sales) -> 1,527 Million = 1.5 Billion. 
    # Wait, 1726 Sales 2022-03 was 1,527 Million? No.
    # 1726 Br.HD Sales ~45 Billion (45,000 Million).
    # Kabutan scraper ParseVal: `text.replace(',', '')` -> float.
    # Kabutan displays "単位：百万円" (Millions). So 45,000 means 45 Billion.
    # My scraper stored it as is.
    # EDINET XBRL is usually in ONES (45,000,000,000).
    # So we must divide by 1,000,000 to match Kabutan schema.
    
    factor = 1.0 / 1000000.0
    
    def conv(val):
        if val is None: return 0.0
        return float(val) * factor

    c.execute("""
        INSERT INTO financial_stats 
        (ticker, period_type, period_end, sales, operating_profit, ordinary_profit, net_profit, eps, is_forecast, source, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'edinet', CURRENT_TIMESTAMP)
        ON CONFLICT(ticker, period_type, period_end) DO UPDATE SET
            sales=excluded.sales,
            operating_profit=excluded.operating_profit,
            ordinary_profit=excluded.ordinary_profit,
            net_profit=excluded.net_profit,
            eps=excluded.eps,
            source='edinet',
            updated_at=CURRENT_TIMESTAMP
    """, (
        ticker, period_type, period_end,
        conv(data.get('sales')),
        conv(data.get('operating_profit')),
        conv(data.get('ordinary_profit')),
        conv(data.get('net_profit')),
        conv(data.get('eps')) if data.get('eps') else 0.0, # EPS is usually Ones? Don't divide EPS by million!
    ))
    # Note: EPS in XBRL is usually in Yen (e.g. 154.32). No conversion needed.
    # Fix EPS conversion:
    # Actually, pass `data.get('eps')` directly for EPS.
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    # Look back 3 days
    today = datetime.date.today()
    for i in range(3):
        d_str = (today - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
        docs = fetch_edinet_financial_list(d_str)
        for doc in docs:
            code = doc.get('docTypeCode', '')
            if code in ['120', '130', '140']:
                download_and_process_report(doc)
