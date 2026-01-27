import sqlite3
import os
from database import get_db_connection

def verify():
    conn = get_db_connection()
    c = conn.cursor()
    
    print("--- Listing Year Stats ---")
    
    c.execute("SELECT count(*) FROM ir_events")
    total = c.fetchone()[0]
    
    c.execute("SELECT count(*) FROM ir_events WHERE listing_year IS NOT NULL")
    filled = c.fetchone()[0]
    
    c.execute("SELECT count(*) FROM ir_events WHERE listing_year IS NULL")
    missing = c.fetchone()[0]
    
    print(f"Total Events: {total}")
    print(f"Filled Listing Year: {filled}")
    print(f"Missing Listing Year: {missing}")
    
    if total > 0:
        print(f"Coverage: {filled / total * 100:.1f}%")
        
    print("\n--- Listing Year Distribution (Top 10) ---")
    c.execute("SELECT listing_year, count(*) FROM ir_events WHERE listing_year IS NOT NULL GROUP BY listing_year ORDER BY count(*) DESC LIMIT 10")
    for row in c.fetchall():
        print(f"{row[0]}: {row[1]} events")

    print("\n--- Revisions Count ---")
    c.execute("SELECT count(*) FROM revisions")
    r_count = c.fetchone()[0]
    print(f"Total Revisions: {r_count}")

    print("\n--- EDINET Documents ---")
    c.execute("SELECT count(*) FROM edinet_documents")
    e_count = c.fetchone()[0]
    print(f"Total EDINET Docs: {e_count}")

    conn.close()

if __name__ == "__main__":
    verify()
