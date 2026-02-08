import datetime
import time
import sys
import os

# Create backend directory context
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fetch_edinet_financials import fetch_edinet_financial_list, download_and_process_report

def backfill_edinet(start_year=2024, end_year=2026):
    """
    Backfill financial data from EDINET.
    Iterates through every day in the range.
    """
    start_date = datetime.date(start_year, 1, 1)
    end_date = datetime.date.today()
    
    current_date = start_date
    
    print(f"Starting EDINET Backfill from {start_date} to {end_date}...")
    
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        print(f"\nProcessing {date_str}...")
        
        try:
            docs = fetch_edinet_financial_list(date_str)
            if not docs:
                print("  No documents found.")
            else:
                count = 0
                for doc in docs:
                    code = doc.get('docTypeCode', '')
                    # 120: Yuho, 130: Quarterly, 140: Tanshin
                    if code in ['120', '130', '140']:
                        # Optimization: Check if we already have this data?
                        # DB insert has ON CONFLICT UPDATE, so it's safe to rerun.
                        # But filtering by 'secCode' presence helps speed up.
                        if not doc.get('secCode'): continue
                        
                        success = download_and_process_report(doc)
                        if success:
                            count += 1
                        time.sleep(0.5) # Be nice to API during bulk
                
                print(f"  Saved {count} financial reports.")
                
        except Exception as e:
            print(f"  Error on {date_str}: {e}")
        
        current_date += datetime.timedelta(days=1)
        time.sleep(1) # Sleep between list fetches

if __name__ == "__main__":
    # Default to last 1 year for now to test speed
    # Or user can specify args
    backfill_edinet(2025, 2026)
