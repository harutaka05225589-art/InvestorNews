
import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')

def simulate_deletion():
    if not os.path.exists(DB_PATH):
        print("DB not found")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Create Dummy User
    try:
        cursor.execute("INSERT INTO users (account_id, email, nickname, password_hash) VALUES ('test_del', 'test_del@example.com', 'TestDel', 'hash')")
        user_id = cursor.lastrowid
        print(f"Created user {user_id}")
    except sqlite3.IntegrityError:
        # Maybe exists
        cursor.execute("SELECT id FROM users WHERE account_id='test_del'")
        user_id = cursor.fetchone()[0]
        print(f"Using existing user {user_id}")

    # 2. Add related data
    try:
        cursor.execute("INSERT INTO alerts (user_id, ticker, target_per, condition, is_active) VALUES (?, '9999', 100, 'up', 1)", (user_id,))
        print("Added alert")
    except Exception as e:
        print(f"Alert add failed: {e}")

    # Check tables existence
    tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]

    if 'portfolio_transactions' in tables:
        try:
            cursor.execute("INSERT INTO portfolio_transactions (user_id, ticker, shares, price) VALUES (?, '9999', 10, 100)", (user_id,))
            print("Added portfolio")
        except Exception as e:
            print(f"Portfolio add failed: {e}")

    if 'notifications' in tables:
        try:
            cursor.execute("INSERT INTO notifications (user_id, message, is_read) VALUES (?, 'test', 0)", (user_id,))
            print("Added notification")
        except Exception as e:
            # might fail due to alert_id constraint?
            print(f"Notification add failed: {e}")

    conn.commit()

    # 3. Try Deletion Logic (Mimic route.ts)
    print("\n--- Starting Deletion Mock ---")
    try:
        # Start Transaction
        conn.execute("BEGIN")

        print("Deleting Alerts...")
        cursor.execute('DELETE FROM alerts WHERE user_id = ?', (user_id,))

        if 'portfolio_transactions' in tables:
            print("Deleting Portfolio...")
            cursor.execute('DELETE FROM portfolio_transactions WHERE user_id = ?', (user_id,))

        if 'invitation_codes' in tables:
            print("Unlinking Invitations...")
            cursor.execute('UPDATE invitation_codes SET used_by_user_id = NULL WHERE used_by_user_id = ?', (user_id,))

        if 'notifications' in tables:
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
        # Cleanup if needed (if failed, user still exists)
        conn.close()

if __name__ == "__main__":
    simulate_deletion()
