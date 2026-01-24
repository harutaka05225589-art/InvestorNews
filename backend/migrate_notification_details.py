import sqlite3
import os
from database import get_db_connection

def migrate():
    conn = get_db_connection()
    c = conn.cursor()
    
    print("Checking 'users' table for notification preference columns...")
    c.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in c.fetchall()]
    
    new_cols = {
        'notify_revisions': 'INTEGER DEFAULT 1',
        'notify_earnings': 'INTEGER DEFAULT 1',
        'notify_price': 'INTEGER DEFAULT 1'
    }
    
    for col, type_def in new_cols.items():
        if col not in columns:
            print(f"Adding '{col}'...")
            c.execute(f"ALTER TABLE users ADD COLUMN {col} {type_def}")
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
