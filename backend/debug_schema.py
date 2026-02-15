
import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')

def inspect_schema():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    print(f"--- Found {len(tables)} tables ---")
    for table_name in tables:
        name = table_name[0]
        print(f"\n[Table: {name}]")
        
        # Get schema
        cursor.execute(f"PRAGMA table_info({name})")
        columns = cursor.fetchall()
        for col in columns:
            # cid, name, type, notnull, dflt_value, pk
            print(f"  - {col[1]} ({col[2]})")

        # Get Foreign Keys
        cursor.execute(f"PRAGMA foreign_key_list({name})")
        fks = cursor.fetchall()
        if fks:
            print("  -> Foreign Keys:")
            for fk in fks:
                # id, seq, table, from, to, on_update, on_delete, match
                print(f"     REFERENCES {fk[2]}({fk[4]}) ON DELETE {fk[6]}")

    conn.close()

if __name__ == "__main__":
    inspect_schema()
