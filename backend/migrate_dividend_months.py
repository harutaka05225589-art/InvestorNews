
import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    # Check if columns exist
    c.execute("PRAGMA table_info(revisions)")
    cols = [row[1] for row in c.fetchall()]
    
    if 'dividend_rights_month' not in cols:
        print("Adding dividend_rights_month column...")
        c.execute("ALTER TABLE revisions ADD COLUMN dividend_rights_month INTEGER")
    else:
        print("dividend_rights_month already exists.")
        
    if 'dividend_payment_month' not in cols:
        print("Adding dividend_payment_month column...")
        c.execute("ALTER TABLE revisions ADD COLUMN dividend_payment_month INTEGER")
    else:
        print("dividend_payment_month already exists.")
        
    conn.commit()
    print("Migration successful.")
    
except Exception as e:
    print(f"Migration failed: {e}")
finally:
    conn.close()
