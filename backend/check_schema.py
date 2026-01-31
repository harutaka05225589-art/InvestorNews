
import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
if not os.path.exists(db_path):
    db_path = 'investor_news.db'

conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    c.execute("PRAGMA table_info(revisions)")
    cols = c.fetchall()
    print("Columns in 'revisions' table:")
    for col in cols:
        print(f"- {col[1]} ({col[2]})")

except Exception as e:
    print(e)
finally:
    conn.close()
