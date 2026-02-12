
import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')

def migrate_notifications():
    if not os.path.exists(DB_PATH):
        print("DB not found")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = OFF") # Disable FKs for migration
    cursor = conn.cursor()
    
    print("Starting migration of notifications table...")

    try:
        conn.execute("BEGIN")

        # 1. Rename existing table
        print("Renaming old table...")
        cursor.execute("ALTER TABLE notifications RENAME TO notifications_old_broken")

        # 2. Create new table (Corrected FKs)
        print("Creating new table...")
        # Note: referencing alerts(id) ON DELETE CASCADE
        # Note: alerts table must exist.
        cursor.execute("""
            CREATE TABLE notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                alert_id INTEGER,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
            )
        """)

        # 3. Copy data
        print("Copying data...")
        cursor.execute("""
            INSERT INTO notifications (id, user_id, alert_id, message, is_read, created_at)
            SELECT id, user_id, alert_id, message, is_read, created_at FROM notifications_old_broken
        """)

        # 4. Drop old table
        print("Dropping old table...")
        cursor.execute("DROP TABLE notifications_old_broken")

        conn.commit()
        print("Migration SUCCESS: notifications table fixed.")

    except Exception as e:
        conn.rollback()
        print(f"Migration FAILED: {e}")
        # Restore if needed (renaming back might be tricky if create succeeded)
        # But rollback should handle it within transaction? DDL in SQLite is transactional?
        # Yes, mostly.

    finally:
        conn.close()

if __name__ == "__main__":
    migrate_notifications()
