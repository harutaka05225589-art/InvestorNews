import sqlite3
import os

# DB Path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    print(f"Migrating database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Add last_triggered_at
    try:
        print("Adding last_triggered_at column to alerts table...")
        c.execute("ALTER TABLE alerts ADD COLUMN last_triggered_at TIMESTAMP")
        print("Success.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("Column last_triggered_at already exists. Skipping.")
        else:
            print(f"Error adding last_triggered_at: {e}")

    # 2. Add current_per (Just in case re-running ensures it)
    try:
        print("Ensuring current_per column exists...")
        c.execute("ALTER TABLE alerts ADD COLUMN current_per REAL")
        print("Success.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("Column current_per already exists. Skipping.")
        else:
            print(f"Error adding current_per: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
