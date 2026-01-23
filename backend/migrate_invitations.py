import sqlite3
import os
import uuid

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 1. Update users table (Add plan)
    print("Checking 'users' table columns...")
    c.execute("PRAGMA table_info(users)")
    columns = [r[1] for r in c.fetchall()]
    
    if 'plan' not in columns:
        print("Adding 'plan' column to users...")
        c.execute("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'")
        
    # 2. Create invitation_codes table
    print("Creating 'invitation_codes' table...")
    c.execute("""
        CREATE TABLE IF NOT EXISTS invitation_codes (
            code TEXT PRIMARY KEY,
            is_used BOOLEAN DEFAULT 0,
            used_by_user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 3. Generate some initial codes for testing/admin
    # Check if empty
    c.execute("SELECT count(*) FROM invitation_codes")
    if c.fetchone()[0] == 0:
        print("Generating 10 initial invitation codes...")
        initial_codes = [str(uuid.uuid4())[:8].upper() for _ in range(10)]
        for code in initial_codes:
            c.execute("INSERT INTO invitation_codes (code) VALUES (?)", (code,))
        
        print("Generated Codes:")
        for code in initial_codes:
            print(f"  - {code}")
            
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
