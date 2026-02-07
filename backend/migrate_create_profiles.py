import sqlite3
import os

# Database Path
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'investor_news.db')

def migrate():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Create stock_profiles table
    print("Creating stock_profiles table...")
    c.execute('''
    CREATE TABLE IF NOT EXISTS stock_profiles (
        ticker TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        description TEXT,
        sector TEXT,
        website_url TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    conn.close()
    print("Migration complete: stock_profiles table created.")

if __name__ == "__main__":
    migrate()
