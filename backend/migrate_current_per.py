import sqlite3
import os

# DB Path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    print(f"Migrating database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    try:
        # Add current_per column (nullable)
        print("Adding current_per column to alerts table...")
        c.execute("ALTER TABLE alerts ADD COLUMN current_per REAL")
        print("Success.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("Column current_per already exists. Skipping.")
        else:
            print(f"Error adding column: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
