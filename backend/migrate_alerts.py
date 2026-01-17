import sqlite3

DB_PATH = '../frontend/investor_news.db'

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Migrating 'alerts' table to support optional PER (NULL target_per)...")
    
    # 1. Rename existing table
    c.execute("ALTER TABLE alerts RENAME TO alerts_old")
    
    # 2. PROPERLY Create new table with nullable target_per
    # Note: We also need company_name? No, we fetch that via JOIN in the API. 
    # But for cleaner data, we just rely on ticker.
    # Previous schema: id, user_id, ticker, target_per, condition, is_active, created_at
    c.execute("""
        CREATE TABLE alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            ticker TEXT NOT NULL,
            target_per REAL, -- Now Nullable
            condition TEXT,  -- Now Nullable
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 3. Copy data
    c.execute("""
        INSERT INTO alerts (id, user_id, ticker, target_per, condition, is_active)
        SELECT id, user_id, ticker, target_per, condition, is_active FROM alerts_old
    """)
    
    # 4. Verify and Drop old
    c.execute("SELECT count(*) FROM alerts")
    new_count = c.fetchone()[0]
    print(f"Migrated {new_count} records.")
    
    c.execute("DROP TABLE alerts_old")
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
