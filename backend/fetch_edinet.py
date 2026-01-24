import requests
import datetime
import sqlite3
import os
import time

# --- CONFIG ---
# Get API Key from Environment or use provided key
API_KEY = os.environ.get('EDINET_API_KEY', 'f438dea945154ea89f2bcbc8960d7b8e')

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def get_tracked_investors():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT name, aliases FROM investors")
    rows = c.fetchall()
    conn.close()
    
    investors = []
    for r in rows:
        name = r[0]
        aliases = r[1].split(',') if r[1] else []
        # Normalize: Remove spaces, etc
        targets = [name] + [a.strip() for a in aliases if a.strip()]
        investors.append({'name': name, 'targets': targets})
    return investors

def fetch_edinet_list(date_str):
    if API_KEY == 'YOUR_API_KEY_HERE':
        print("WARNING: API Key not set. Please set EDINET_API_KEY env var or edit script.")
        return []

    url = f"https://disclosure.edinet-fsa.go.jp/api/v2/documents.json?date={date_str}&type=2&Subscription-Key={API_KEY}"
    print(f"Fetching EDINET list for {date_str}...")
    
    try:
        res = requests.get(url, timeout=30)
        if res.status_code == 200:
            data = res.json()
            return data.get('results', [])
        else:
            print(f"Failed to fetch list: {res.status_code} {res.text}")
            return []
    except Exception as e:
        print(f"Error fetching list: {e}")
        return []

def save_document(doc, investor_name):
    conn = get_db_connection()
    c = conn.cursor()
    
    doc_id = doc.get('docID')
    submitter = doc.get('filerName')
    subject_code = doc.get('secCode') # Ticker usually
    desc = doc.get('docDescription')
    submitted_at = doc.get('submitDateTime')
    
    # Check duplicate
    c.execute("SELECT id FROM edinet_documents WHERE id = ?", (doc_id,))
    if c.fetchone():
        conn.close()
        return False

    print(f"  [MATCH] Saving: {submitter} -> {desc}")
    
    pdf_link = f"https://disclosure.edinet-fsa.go.jp/api/v2/documents/{doc_id}?type=2&Subscription-Key={API_KEY}"
    
    # Calculate investor_id
    investor_id = None
    if investor_name:
        c.execute("SELECT id FROM investors WHERE name = ? LIMIT 1", (investor_name,))
        row = c.fetchone()
        if row:
            investor_id = row[0]

    c.execute("""
        INSERT INTO edinet_documents (id, submitter_name, subject_edinet_code, doc_description, submitted_at, pdf_link, investor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (doc_id, submitter, subject_code, desc, submitted_at, pdf_link, investor_id))
    
    conn.commit()
    conn.close()
    return True

def run_check():
    import sys
    test_mode = "--test" in sys.argv
    
    if test_mode:
        print("--- EDINET API TEST MODE ---")
        print(f"Using API Key: {API_KEY}")
        d_str = datetime.date.today().strftime('%Y-%m-%d')
        print(f"Fetching list for {d_str}...")
        docs = fetch_edinet_list(d_str)
        if docs:
            print(f"Success! Retrieved {len(docs)} documents.")
            print(f"First document: {docs[0].get('filerName')} - {docs[0].get('docDescription')}")
        else:
            print("Failed to retrieve any documents. Check Key or Server connectivity.")
        return

    # Normal Mode
    dates_to_check = [
        datetime.date.today(),
        datetime.date.today() - datetime.timedelta(days=1)
    ]
    
    investors = get_tracked_investors()
    print(f"Tracking {len(investors)} investors for matching purposes (Capturing ALL reports)...")
    
    total_saved = 0
    
    for d in dates_to_check:
        d_str = d.strftime('%Y-%m-%d')
        docs = fetch_edinet_list(d_str)
        print(f"  > Retrieved {len(docs)} raw documents for {d_str}")
        
        # Filter Logic
        saved_count = 0
        skipped_debug = 0
        
        for doc in docs:
            doc_code = doc.get('docCode', '')
            
            # Debug: Print first few skipped codes to verify they are indeed irrelevant
            # 120, 130, 140 range usually implies ownership reports
            if not (doc_code.startswith('120') or doc_code.startswith('130') or doc_code.startswith('140')):
                if skipped_debug < 10:
                    print(f"    [SKIP] Code: {doc_code}, Desc: {doc.get('docDescription')}")
                    skipped_debug += 1
                continue
                
            filer = doc.get('filerName', '')
            if not filer: continue
            filer = filer.replace('　', ' ').strip() # Normalize space
            
            # Identify Investor (Optional)
            matched_investor = None
            for inv in investors:
                for target in inv['targets']:
                    clean_filer = filer.replace(' ', '')
                    clean_target = target.replace(' ', '')
                    if clean_target in clean_filer:
                        matched_investor = inv['name']
                        break
                if matched_investor:
                    break
            
            # Save Document (All 120/130/140 reports)
            # Pass matched_investor (can be None)
            saved = save_document(doc, matched_investor)
            if saved: total_saved += 1

    print(f"EDINET Check Complete. Saved {total_saved} new reports.")

if __name__ == "__main__":
    run_check()
