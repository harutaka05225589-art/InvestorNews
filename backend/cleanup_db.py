import sqlite3
import os

DB_NAME = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def cleanup_summaries():
    if not os.path.exists(DB_NAME):
        print(f"Database not found at {DB_NAME}")
        return

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    print("Cleaning up news summaries...")
    
    # Fetch all news items
    items = c.execute("SELECT id, summary FROM news_items").fetchall()
    
    count = 0
    for item_id, summary in items:
        if not summary: continue
        
        original_summary = summary
        
        # Remove "自動収集された記事です"
        summary = summary.replace("自動収集された記事です", "")
        summary = summary.replace("詳細を見る", "")
        
        # Check if changed
        if summary != original_summary:
            c.execute("UPDATE news_items SET summary = ? WHERE id = ?", (summary.strip(), item_id))
            count += 1
            print(f"Cleaned item {item_id}")

    conn.commit()
    conn.close()
    print(f"Cleanup complete. Updated {count} items.")

if __name__ == "__main__":
    cleanup_summaries()
