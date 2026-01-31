import sqlite3
import os
import time

db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if ID 1 exists again to be safe
    cursor.execute("SELECT id FROM users WHERE id = 1")
    if cursor.fetchone():
        print("User 1 already exists.")
    else:
        print("Creating User 1 (Guest/Default)...")
        # Use a dummy hash since this accounts is mainly for key constraints in dev
        pwd_hash = "dummy_hash_no_bcrypt_needed"
        now = int(time.time())
        
        # Depending on schema, columns might vary. 
        # Checking schema first
        cursor.execute("PRAGMA table_info(users)")
        cols = [c[1] for c in cursor.fetchall()]
        print(f"Users columns: {cols}")
        
        # Construct INSERT based on typical schema (email, password_hash, nickname, etc.)
        # Assuming: id, email, password_hash, nickname, created_at, updated_at
        
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, nickname, created_at, updated_at)
            VALUES (1, 'guest@example.com', ?, 'Guest User', ?, ?)
        """, (pwd_hash, now, now))
        conn.commit()
        print("User 1 created successfully.")

except Exception as e:
    print(f"Error creating user: {e}")
finally:
    conn.close()
