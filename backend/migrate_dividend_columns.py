import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '../frontend/investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Adding dividend columns to revisions table...")
    
    try:
        c.execute("ALTER TABLE revisions ADD COLUMN dividend_forecast_annual REAL")
        print("- Added dividend_forecast_annual")
    except sqlite3.OperationalError:
        print("- dividend_forecast_annual already exists")

    try:
        c.execute("ALTER TABLE revisions ADD COLUMN is_dividend_hike BOOLEAN DEFAULT 0")
        print("- Added is_dividend_hike")
    except sqlite3.OperationalError:
        print("- is_dividend_hike already exists")

    conn.commit()
    conn.close()
    print("Migration 'migrate_dividend_columns' completed.")

if __name__ == "__main__":
    migrate()
