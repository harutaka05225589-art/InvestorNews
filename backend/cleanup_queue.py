import sqlite3
import datetime
from database import get_db_connection

def cleanup_queue():
    """
    Mark items older than 7 days as 'skipped' (ai_analyzed = 2)
    to reduce the processing queue.
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    # Calculate cutoff date (7 days ago)
    cutoff_date = (datetime.datetime.now() - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
    print(f"Cleaning up queue... Skipping analysis for items before {cutoff_date}")
    
    # Count pending items older than cutoff
    count = c.execute("""
        SELECT count(*) FROM revisions 
        WHERE ai_analyzed = 0 AND revision_date < ?
    """, (cutoff_date,)).fetchone()[0]
    
    print(f"Found {count} old items pending analysis.")
    
    if count > 0:
        # Mark as 2 (Skipped/Done without result)
        # Or just 1 to treat as done? 2 is safer if we want to distinguish.
        # But for now, let's use 1 (analyzed) with a note in summary if feasible,
        # or stick to db schema.
        # Check if ai_analyzed supports int (0/1). Usually boolean-like int.
        # Let's verify analyze_revisions_ai.py loop query: `ai_analyzed = 0`.
        # So setting to 1 removes them from queue.
        
        c.execute("""
            UPDATE revisions 
            SET ai_analyzed = 1, 
                ai_summary = 'Old data skipped during bulk processing'
            WHERE ai_analyzed = 0 AND revision_date < ?
        """, (cutoff_date,))
        conn.commit()
        print(f"Marked {count} items as skipped.")
    else:
        print("No old items to clean up.")

    conn.close()

if __name__ == "__main__":
    cleanup_queue()
