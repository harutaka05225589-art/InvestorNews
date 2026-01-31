
import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
if not os.path.exists(db_path):
    # Fallback for relative path execution
    db_path = 'investor_news.db'

print(f"Migrating DB at: {db_path}")
conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    # Check existing columns
    c.execute("PRAGMA table_info(revisions)")
    cols = [col[1] for col in c.fetchall()]
    
    if 'dividend_forecast_annual' not in cols:
        print("Adding dividend_forecast_annual...")
        c.execute("ALTER TABLE revisions ADD COLUMN dividend_forecast_annual REAL")
    
    if 'is_dividend_hike' not in cols:
        print("Adding is_dividend_hike...")
        c.execute("ALTER TABLE revisions ADD COLUMN is_dividend_hike BOOLEAN")

    conn.commit()
    print("Migration successful.")

except Exception as e:
    print(f"Migration error: {e}")
finally:
    conn.close()
