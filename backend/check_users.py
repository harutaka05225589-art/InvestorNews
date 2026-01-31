
import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check User ID 1
    cursor.execute("SELECT id, nickname FROM users WHERE id = 1")
    user = cursor.fetchone()
    if user:
        print(f"User ID 1 exists: {user}")
    else:
        print("User ID 1 DOES NOT exist.")
        
    # Check Portfolio Transactions Schema/FK
    cursor.execute("PRAGMA foreign_key_list(portfolio_transactions)")
    fks = cursor.fetchall()
    print("Foreign Keys in portfolio_transactions:")
    for fk in fks:
        print(fk)

    # List all users
    cursor.execute("SELECT id, nickname FROM users")
    users = cursor.fetchall()
    print(f"All Users: {users}")

except Exception as e:
    print(e)
finally:
    conn.close()
