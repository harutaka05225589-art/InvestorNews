import sqlite3
import datetime
from database import get_db_connection

def reset_past_week():
    conn = get_db_connection()
    c = conn.cursor()
    
    # 7 days ago
    start_date = datetime.date(2026, 1, 19).strftime('%Y-%m-%d')
    print(f"Resetting analysis for data since: {start_date}")
    
    # Check count
    count = c.execute("SELECT count(*) FROM revisions WHERE revision_date >= ?", (start_date,)).fetchone()[0]
    print(f"Found {count} revisions in target period.")
    
    if count > 0:
        print("Resetting 'ai_analyzed' to 0 and clearing results...")
        c.execute("""
            UPDATE revisions 
            SET ai_analyzed = 0, 
                ai_summary = NULL, 
                is_upward = NULL, 
                revision_rate_op = NULL 
            WHERE revision_date >= ?
        """, (start_date,))
        conn.commit()
        print("Done. Please run analyze_revisions_ai.py loop to reprocess.")
    else:
        print("Nothing to reset.")

    conn.close()

if __name__ == "__main__":
    reset_past_week()
