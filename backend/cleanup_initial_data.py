import sqlite3
import os

DB_PATH = 'frontend/investor_news.db'

def cleanup():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    try:
        # Check count before
        c.execute("SELECT COUNT(*) FROM revisions WHERE title = 'YahooFinance_Initial'")
        count_before = c.fetchone()[0]
        print(f"Found {count_before} entries with title 'YahooFinance_Initial'.")

        if count_before > 0:
            c.execute("DELETE FROM revisions WHERE title = 'YahooFinance_Initial'")
            conn.commit()
            print(f"Successfully deleted {count_before} entries.")
        else:
            print("No entries to delete.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    cleanup()
