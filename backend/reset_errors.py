import sqlite3
import os

DB_PATH = "frontend/investor_news.db"

def reset_errors():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Find items that failed or have error messages
    # ai_analyzed = 2 (Failed) or ai_summary contains 'Error'/'Failed'/'解析不可'
    query = """
        SELECT id, ticker, ai_summary FROM revisions 
        WHERE ai_analyzed = 2 
           OR ai_summary LIKE '%Error%' 
           OR ai_summary LIKE '%Failed%' 
           OR ai_summary LIKE '%解析不可%'
           OR ai_summary LIKE '%processing error%'
    """
    
    rows = c.execute(query).fetchall()
    print(f"Found {len(rows)} error items to reset.")
    
    ids_to_reset = [row[0] for row in rows]
    
    if ids_to_reset:
        c.execute(f"UPDATE revisions SET ai_analyzed = 0, ai_summary = NULL WHERE id IN ({','.join(['?']*len(ids_to_reset))})", ids_to_reset)
        conn.commit()
        print(f"Reset {len(ids_to_reset)} items.")
        for r in rows:
            print(f"  - Reset {r[1]} (was: {r[2]})")
    else:
        print("No error items found.")

    conn.close()

if __name__ == "__main__":
    reset_errors()
