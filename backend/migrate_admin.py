
import sqlite3
import os
import sys

# Database path (Relative to backend/)
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'investor_news.db')

def migrate_admin(admin_email=None):
    print(f"Migrating database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Add is_admin column to users table if not exists
    print("Checking 'users' table schema...")
    try:
        c.execute("SELECT is_admin FROM users LIMIT 1")
        print("'is_admin' column already exists.")
    except sqlite3.OperationalError:
        print("Adding 'is_admin' column to 'users' table...")
        c.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0")
        print("Column added.")

    # 2. Set Admin User
    if admin_email:
        print(f"Setting user {admin_email} as admin...")
        c.execute("UPDATE users SET is_admin = 1 WHERE email = ?", (admin_email,))
        if c.rowcount > 0:
            print(f"Success: {admin_email} is now an admin.")
        else:
            print(f"Warning: User {admin_email} not found.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    migrate_admin(email)
