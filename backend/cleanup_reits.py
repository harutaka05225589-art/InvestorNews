import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def cleanup():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Deleting '投資法人' records from ir_events...")
    
    # Check count before
    c.execute("SELECT COUNT(*) FROM ir_events WHERE company_name LIKE '%投資法人%'")
    count = c.fetchone()[0]
    print(f"Found {count} records to delete.")
    
    # Delete
    c.execute("DELETE FROM ir_events WHERE company_name LIKE '%投資法人%'")
    conn.commit()
    
    print("Cleanup complete.")
    conn.close()

if __name__ == "__main__":
    cleanup()
