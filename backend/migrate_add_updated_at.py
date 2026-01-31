
import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
if not os.path.exists(db_path):
    db_path = 'investor_news.db'

print(f"Connecting to: {db_path}")
conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    c.execute("ALTER TABLE revisions ADD COLUMN updated_at TEXT")
    print("Added updated_at column.")
except Exception as e:
    print(f"Error (probably already exists): {e}")

conn.commit()
conn.close()
