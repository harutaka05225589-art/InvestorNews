import sqlite3
import os
import datetime

DB_PATH = "frontend/investor_news.db"

def force_reset_recent():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Calculate date 2 days ago
    two_days_ago = (datetime.datetime.now() - datetime.timedelta(days=2)).strftime('%Y-%m-%d')
    print(f"Resetting items since {two_days_ago}...")

    # Reset analyzed items to 0 to force re-analysis
    c.execute("""
        UPDATE revisions 
        SET ai_analyzed = 0, ai_summary = NULL 
        WHERE revision_date >= ?
    """, (two_days_ago,))
    
    conn.commit()
    print(f"Reset {c.rowcount} items.")
    conn.close()

if __name__ == "__main__":
    force_reset_recent()
