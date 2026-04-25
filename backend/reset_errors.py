import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def reset_errors():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Resetting AI analysis status for stuck/errored items...")
    
    # 1. Reset items stuck in 'processing' (ai_analyzed = 2)
    c.execute("UPDATE revisions SET ai_analyzed = 0 WHERE ai_analyzed = 2")
    stuck_count = c.rowcount
    
    # 2. Reset items that failed analysis (ai_summary = '解析不可' or similar)
    c.execute("UPDATE revisions SET ai_analyzed = 0 WHERE ai_analyzed = 1 AND (ai_summary = '解析不可' OR ai_summary = 'Invalid URL')")
    failed_count = c.rowcount
    
    conn.commit()
    
    print(f"Reset {stuck_count} stuck items.")
    print(f"Reset {failed_count} failed items.")
    print("You can now run 'python3 analyze_revisions_ai.py' to retry.")
    
    conn.close()

if __name__ == "__main__":
    reset_errors()
