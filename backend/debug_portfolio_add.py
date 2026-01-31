
import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

user_id = 1
ticker = "7203"
shares = 100
price = 2000
date = "2024-01-01"
account_type = "general"

print(f"Attempting to insert: User={user_id}, Ticker={ticker}")

try:
    cursor.execute("""
        INSERT INTO portfolio_transactions (user_id, ticker, shares, price, transaction_date, account_type)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, ticker, shares, price, date, account_type))
    conn.commit()
    print("Success! Last Record ID:", cursor.lastrowid)
    
    # Cleanup
    cursor.execute("DELETE FROM portfolio_transactions WHERE id = ?", (cursor.lastrowid,))
    conn.commit()
    print("Cleaned up test record.")
    
except Exception as e:
    print("FAILED with error:", e)
finally:
    conn.close()
