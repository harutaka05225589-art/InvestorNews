import sqlite3
import os
import datetime

# Define DB Path explicitly or relative
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def force_retry():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Reset last 3 days
    date_threshold = (datetime.date.today() - datetime.timedelta(days=3)).strftime('%Y-%m-%d')
    
    print(f"Resetting AI analysis status for revisions since {date_threshold}...")
    
    c.execute("UPDATE revisions SET ai_analyzed = 0 WHERE revision_date >= ?", (date_threshold,))
    conn.commit()
    
    count = c.rowcount
    print(f"Reset {count} items. You can now run 'python3 analyze_revisions_ai.py'.")
    
    conn.close()

if __name__ == "__main__":
    force_retry()
