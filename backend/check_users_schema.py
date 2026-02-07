import sqlite3
import os

db_path = os.path.join('frontend', 'investor_news.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("PRAGMA table_info(users)")
print(f"Users Schema: {c.fetchall()}")

conn.close()
