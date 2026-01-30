import sqlite3
import time
import os
from database import get_db_connection
from analyze_revisions_ai import analyze_revision_pdf
import requests
import tempfile
import json # Import json to handle encoding

def process_backlog(limit=50):
    """
    Processes revisions that were backfilled (ai_analyzed=3).
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    print(f"Checking for backfilled revisions (ai_analyzed=3)...")
    
    # Fetch backlog
    rows = c.execute("""
        SELECT id, ticker, company_name, title, source_url 
        FROM revisions 
        WHERE ai_analyzed = 3 
          AND source_url LIKE '%.pdf'
        ORDER BY revision_date DESC
        LIMIT ?
    """, (limit,)).fetchall()
    
    if not rows:
        print("No backlog found.")
        conn.close()
        return

    print(f"Found {len(rows)} backlog items. Starting AI Analysis...")
    
    for row in rows:
        rev_id = row['id']
        url = row['source_url']
        title = row['title']
        ticker = row['ticker']
        
        print(f"\n[Backlog] Processing {ticker} ({rev_id}): {title}")
        
        try:
            # Download
            res = requests.get(url, timeout=15)
            if res.status_code != 200:
                print(f"  Download failed: {res.status_code}")
                c.execute("UPDATE revisions SET ai_analyzed = 2 WHERE id = ?", (rev_id,))
                conn.commit()
                continue
                
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(res.content)
                tmp_path = tmp.name
                
            # Analyze
            result = analyze_revision_pdf(tmp_path, title)
            os.remove(tmp_path)
            
            if result:
                is_upward = result.get('is_upward') 
                rate = result.get('revision_rate_op', 0.0)
                summary = result.get('summary', '解析不可')
                quarter = result.get('quarter', None)
                forecast_data = result.get('forecast_data', None)
                
                # Encode JSON safely
                forecast_data_json = json.dumps(forecast_data, ensure_ascii=False) if forecast_data else None
                
                print(f"  Result: Up={is_upward}, Rate={rate}%, Q={quarter}")
                
                is_up_int = 1 if is_upward else 0 if is_upward is False else None
                
                # Save (Update from status 3 to 1)
                c.execute("""
                    UPDATE revisions 
                    SET is_upward = ?, 
                        revision_rate_op = ?,
                        ai_summary = ?,
                        forecast_data = ?,
                        quarter = ?,
                        ai_analyzed = 1
                    WHERE id = ?
                """, (is_up_int, rate, summary, forecast_data_json, quarter, rev_id))
                conn.commit()
                
            else:
                print("  Analysis Failed (No Result)")
                c.execute("UPDATE revisions SET ai_analyzed = 2 WHERE id = ?", (rev_id,))
                conn.commit()
                
            # Respect Rate Limit (Gemini Free Tier is ~15 RPM, so 4s delay is min, go 10s to be safe)
            time.sleep(10)
            
        except Exception as e:
            if "QUOTA" in str(e).upper():
                print("!!! QUOTA EXCEEDED !!! Stopping backlog process.")
                break
            print(f"  Error: {e}")
            
    conn.close()
    print("Backlog batch completed.")

if __name__ == "__main__":
    # Loop until stopped or empty
    while True:
        process_backlog(limit=10)
        print("Waiting 60s before next batch to cool down API...")
        time.sleep(60)
