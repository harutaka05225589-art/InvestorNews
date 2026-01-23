import sqlite3
import os
from database import get_db_connection

def migrate():
    conn = get_db_connection()
    c = conn.cursor()
    
    print("Checking 'revisions' table columns...")
    c.execute("PRAGMA table_info(revisions)")
    columns = [r[1] for r in c.fetchall()]
    
    if 'title' not in columns:
        print("Adding 'title' column...")
        c.execute("ALTER TABLE revisions ADD COLUMN title TEXT")
    
    conn.commit()
    conn.close()
    print("Migration complete: 'title' added.")

if __name__ == "__main__":
    migrate()
