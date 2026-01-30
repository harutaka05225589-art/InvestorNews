import sqlite3
import os
from database import get_db_connection

def reset_recent_analysis(days=2):
    """
    Resets the ai_analyzed flag to 3 (Backlog) for revisions in the last N days.
    This allows process_backlog.py to re-analyze them with the new logic (Quarter extraction).
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    print(f"Resetting analysis status for revisions from the last {days} days...")
    
    # 1: Analyzed, 2: Failed, 3: Backlog
    # We want to turn 1 and 2 back into 3 so they get picked up again.
    c.execute(f"""
        UPDATE revisions 
        SET ai_analyzed = 3 
        WHERE (ai_analyzed = 1 OR ai_analyzed = 2)
          AND date(revision_date) >= date('now', '-{days} day')
    """)
    
    count = c.rowcount
    conn.commit()
    conn.close()
    
    print(f"Reset complete. {count} records marked for re-analysis.")
    print("Now run: python3 backend/process_backlog.py")

if __name__ == "__main__":
    reset_recent_analysis()
