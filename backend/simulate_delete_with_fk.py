
import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')

def simulate_deletion_fk():
    if not os.path.exists(DB_PATH):
        print("DB not found")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON") # Enable FKs
    cursor = conn.cursor()
    
    print("FKs Enabled")

    # 1. Create Dummy User
    try:
        cursor.execute("INSERT INTO users (account_id, email, nickname, password_hash) VALUES ('test_del_fk', 'test_fk@example.com', 'TestFK', 'hash')")
        user_id = cursor.lastrowid
        print(f"Created user {user_id}")
    except sqlite3.IntegrityError:
        cursor.execute("SELECT id FROM users WHERE account_id='test_del_fk'")
        user_id = cursor.fetchone()[0]
        print(f"Using existing user {user_id}")

    # 2. Add related data
    try:
        cursor.execute("INSERT INTO notifications (user_id, message, is_read) VALUES (?, 'test fk', 0)", (user_id,))
        print("Added notification")
    except Exception as e:
        print(f"Notification add failed: {e}")

    conn.commit()

    # 3. Try Deletion
    print("\n--- Starting Deletion Mock (FK ON) ---")
    try:
        conn.execute("BEGIN")
        
        # Explicit delete (as per route.ts)
        print("Deleting Notifications...")
        cursor.execute('DELETE FROM notifications WHERE user_id = ?', (user_id,))

        print("Deleting User...")
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        
        conn.commit()
        print("Deletion SUCCESS")

    except Exception as e:
        conn.rollback()
        print(f"Deletion FAILED: {e}")

    finally:
        conn.close()

if __name__ == "__main__":
    simulate_deletion_fk()
