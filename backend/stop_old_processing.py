"""
Stop ALL reprocessing. Past 2 weeks data was already analyzed successfully.
Only recover items where AI analysis succeeded but got overwritten by bug.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def fix_all():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Recover items that have valid analysis data but ai_analyzed=2
    recovered = c.execute("""
        UPDATE revisions 
        SET ai_analyzed = 1
        WHERE ai_analyzed = 2
          AND (
              forecast_data IS NOT NULL
              OR ai_prospects IS NOT NULL  
              OR (is_upward IS NOT NULL AND revision_rate_op IS NOT NULL AND revision_rate_op != 0)
              OR (dividend_forecast_annual IS NOT NULL AND dividend_forecast_annual > 0)
          )
    """)
    print(f"✅ Recovered {c.rowcount} items (had valid AI results, were marked as error)")

    # 2. Stop ALL remaining pending items (ai_analyzed=0) - already processed, no need to redo
    pending = c.execute("""
        UPDATE revisions 
        SET ai_analyzed = 1, 
            ai_summary = COALESCE(NULLIF(ai_summary, 'Processing Error'), '過去データのためスキップ'),
            retry_count = 3
        WHERE ai_analyzed = 0
    """)
    print(f"✅ Stopped {c.rowcount} pending items (no need to reprocess)")

    # 3. Mark remaining ai_analyzed=2 items as done (they failed and have no valid data)
    stuck = c.execute("""
        UPDATE revisions 
        SET ai_analyzed = 1, 
            ai_summary = COALESCE(NULLIF(ai_summary, 'Processing Error'), '解析スキップ'),
            retry_count = 3
        WHERE ai_analyzed = 2
    """)
    print(f"✅ Cleared {c.rowcount} remaining stuck items")

    conn.commit()

    # Stats
    for row in c.execute("SELECT ai_analyzed, COUNT(*) FROM revisions GROUP BY ai_analyzed").fetchall():
        labels = {0: 'Pending', 1: 'Done', 2: 'Error'}
        print(f"  ai_analyzed={row[0]} ({labels.get(row[0], '?')}): {row[1]}")

    conn.close()
    print("\n✅ All done. Only new items will be processed going forward.")

if __name__ == "__main__":
    fix_all()
