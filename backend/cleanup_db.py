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
        
        import re
        
        # Remove "自動収集された記事です" and "詳細を見る"
        summary = summary.replace("自動収集された記事です", "")
        summary = summary.replace("詳細を見る", "")
        
        # Regex to remove Google News URLs
        summary = re.sub(r'https?://news\.google\.com\S+', '', summary)
        
        # Regex to remove any URL at the very end of the string
        summary = re.sub(r'https?://\S+$', '', summary.strip())
        
        # Remove HTML tags (specifically anchor tags showing up as text)
        # e.g. <a href="...">
        summary = re.sub(r'<a\s+href=.*?>.*?</a>', '', summary, flags=re.IGNORECASE)
        summary = re.sub(r'<a\s+href=.*', '', summary, flags=re.IGNORECASE) # Truncated at end
        summary = re.sub(r'</?a>', '', summary, flags=re.IGNORECASE) # Stray tags
        summary = summary.replace('<a href="', '') # Explicit fix for user report
        summary = summary.replace('<a href=', '')

        
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
