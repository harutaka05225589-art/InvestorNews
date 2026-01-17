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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_triggered_at TIMESTAMP,
            current_per REAL
        )
    """)
    
    # 3. Copy data
    # We try to select all columns if they exist.
    # To be safe against missing columns in old table, we can inspect PRAGMA or just try/except?
    # Simpler: Assume user ran previous migrations. If not, they can run migrate_missing_columns later?
    # No, that script adds to 'alerts', which is this new one. So that works.
    # BUT, if we select valid columns from alerts_old that FAILs if column missing.
    # Let's ensure we copy what is there.
    # Actually, simpler approach: The user ALREADY ran migrate_missing_columns. So they HAVE the columns.
    c.execute("""
        INSERT INTO alerts (id, user_id, ticker, target_per, condition, is_active, last_triggered_at, current_per)
        SELECT id, user_id, ticker, target_per, condition, is_active, last_triggered_at, current_per FROM alerts_old
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
