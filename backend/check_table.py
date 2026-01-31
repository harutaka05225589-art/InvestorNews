
import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='portfolio_transactions'")
    table = cursor.fetchone()
    if table:
        print("Table 'portfolio_transactions' exists.")
        # Check columns
        cursor.execute("PRAGMA table_info(portfolio_transactions)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"Column: {col[1]} ({col[2]})")
    else:
        print("Table 'portfolio_transactions' DOES NOT exist.")
except Exception as e:
    print(e)
finally:
    conn.close()
