import sqlite3
import os
from database import get_db_connection

def migrate():
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        print("Adding dividend_forecast_previous column to revisions table...")
        c.execute("ALTER TABLE revisions ADD COLUMN dividend_forecast_previous REAL")
        print("Done.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column already exists.")
        else:
            print(f"Error: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
