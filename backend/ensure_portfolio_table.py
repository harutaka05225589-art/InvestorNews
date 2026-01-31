
import sqlite3
import os

# Explicitly target the frontend db
db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}, trying current dir...")
    db_path = 'investor_news.db'

print(f"Connecting to: {db_path}")
conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    c.execute("""
        CREATE TABLE IF NOT EXISTS portfolio_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ticker TEXT NOT NULL,
            shares REAL NOT NULL,
            price REAL NOT NULL,
            transaction_date TEXT,
            account_type TEXT DEFAULT 'general',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    print("Table 'portfolio_transactions' validated/created successfully.")
    
    # Check if foreign key to user 1 issue might persist (orphaned rows?)
    # No, table was missing so it's empty.
    
except Exception as e:
    print(f"Error creating table: {e}")
finally:
    conn.close()
