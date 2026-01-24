import sqlite3
import os
from database import get_db_connection

def migrate():
    conn = get_db_connection()
    c = conn.cursor()
    
    print("Checking 'users' table for LINE columns...")
    c.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in c.fetchall()]
    
    if 'line_user_id' not in columns:
        print("Adding 'line_user_id'...")
        c.execute("ALTER TABLE users ADD COLUMN line_user_id TEXT")
    
    if 'line_link_nonce' not in columns:
        print("Adding 'line_link_nonce'...")
        c.execute("ALTER TABLE users ADD COLUMN line_link_nonce TEXT")
        
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
