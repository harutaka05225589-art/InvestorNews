"""
Migration: Add retry_count column to revisions table.
Also resets all stuck 'Processing Error' items (ai_analyzed=2) to ai_analyzed=0
so they can be reprocessed with the new error-resilient code.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Add retry_count column if it doesn't exist
    try:
        c.execute("ALTER TABLE revisions ADD COLUMN retry_count INTEGER DEFAULT 0")
        print("✅ Added retry_count column to revisions table")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("ℹ️  retry_count column already exists")
        else:
            raise

    # 2. Reset all stuck 'Processing Error' items (ai_analyzed=2) to 0 for reprocessing
    count = c.execute("SELECT COUNT(*) FROM revisions WHERE ai_analyzed = 2").fetchone()[0]
    print(f"Found {count} items stuck as 'Processing Error' (ai_analyzed=2)")

    if count > 0:
        c.execute("UPDATE revisions SET ai_analyzed = 0, retry_count = 0, ai_summary = NULL WHERE ai_analyzed = 2")
        print(f"✅ Reset {count} items to ai_analyzed=0 for reprocessing")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
