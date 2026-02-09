
import sqlite3
import os

def check_companies():
    # Check both possible paths
    paths = [
        os.path.join(os.getcwd(), 'investor_news.db'),
        os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
    ]
    
    for db_path in paths:
        if os.path.exists(db_path):
            print(f"--- Checking DB at: {db_path} ---")
            try:
                conn = sqlite3.connect(db_path)
                c = conn.cursor()
                
                # Check table existence
                c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='companies'")
                if not c.fetchone():
                    print("Table 'companies' DOES NOT EXIST.")
                else:
                    print("Table 'companies' exists.")
                    # Check count
                    c.execute("SELECT COUNT(*) FROM companies")
                    count = c.fetchone()[0]
                    print(f"Total companies: {count}")
                    
                    # Check Toyota
                    print("Checking for Toyota (7203)...")
                    c.execute("SELECT * FROM companies WHERE ticker = '7203'")
                    print(c.fetchall())
                    
                    # Check partial match
                    print("Checking for 'トヨタ'...")
                    c.execute("SELECT * FROM companies WHERE name LIKE '%トヨタ%' LIMIT 5")
                    print(c.fetchall())

                conn.close()
            except Exception as e:
                print(f"Error reading DB: {e}")
        else:
            print(f"DB not found at: {db_path}")

if __name__ == "__main__":
    check_companies()
