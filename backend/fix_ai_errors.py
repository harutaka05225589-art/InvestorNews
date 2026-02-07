import sqlite3
import os

db_path = 'frontend/investor_news.db'
if not os.path.exists(db_path):
    print("DB not found")
    exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    # Reset 'Processing Error' items
    c.execute("UPDATE revisions SET ai_analyzed=0, ai_summary=NULL WHERE ai_summary='Processing Error' OR ai_summary LIKE '%Error%'")
    print(f"Reset {c.rowcount} error revisions.")
    
    # Also verify the portfolio page existence
    c.execute("SELECT count(*) FROM revisions")
    print(f"Total revisions: {c.fetchone()[0]}")
    
    conn.commit()
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
