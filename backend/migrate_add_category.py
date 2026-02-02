import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        print("Adding 'category' column to revisions table...")
        c.execute("ALTER TABLE revisions ADD COLUMN category TEXT DEFAULT 'general'")
        print("Column added successfully.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("Column 'category' already exists.")
        else:
            print(f"Error adding column: {e}")

    # Backfill categories based on title
    print("Backfilling categories...")
    rows = c.execute("SELECT id, title FROM revisions").fetchall()
    
    for row in rows:
        rid, title = row
        cat = 'general'
        
        is_earnings = any(k in title for k in ['業績', '修正', '差異'])
        is_dividend = any(k in title for k in ['配当', '剰余金'])
        is_buyback = '自己株式' in title
        
        if is_earnings and is_dividend:
            cat = 'both'
        elif is_earnings:
            cat = 'earnings'
        elif is_dividend:
            cat = 'dividend'
        elif is_buyback:
            cat = 'buyback'
            
        c.execute("UPDATE revisions SET category = ? WHERE id = ?", (cat, rid))
        
    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
