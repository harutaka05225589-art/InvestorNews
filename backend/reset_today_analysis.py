import sqlite3
import datetime
from database import get_db_connection

def reset_today():
    conn = get_db_connection()
    c = conn.cursor()
    
    today_str = datetime.date.today().strftime('%Y-%m-%d')
    print(f"Targeting date: {today_str}")
    
    # Check how many analyzed
    count = c.execute("SELECT count(*) FROM revisions WHERE revision_date = ? AND ai_analyzed = 1", (today_str,)).fetchone()[0]
    print(f"Found {count} analyzed revisions for today.")
    
    if count > 0:
        print("Resetting 'ai_analyzed' to 0...")
        c.execute("UPDATE revisions SET ai_analyzed = 0, ai_summary = NULL, is_upward = NULL, revision_rate_op = NULL WHERE revision_date = ?", (today_str,))
        conn.commit()
        print("Done. Please run analyze_revisions_ai.py again.")
    else:
        print("Nothing to reset.")

    conn.close()

if __name__ == "__main__":
    reset_today()
