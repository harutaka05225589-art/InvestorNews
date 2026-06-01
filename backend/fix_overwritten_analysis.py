"""
Fix: Recover items that were successfully analyzed but got overwritten by the
UnboundLocalError bug.

The bug: AI analysis succeeded and set ai_analyzed=1 with a valid ai_summary,
but then time.sleep(15) threw UnboundLocalError, which was caught by the outer
except block that overwrote them to ai_analyzed=2, ai_summary='Processing Error'.

This script finds items that have real analysis data (forecast_data, ai_prospects, 
is_upward, etc.) but are marked as ai_analyzed=2, and restores them to ai_analyzed=1.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def fix_overwritten():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Find items that have real analysis results but are incorrectly marked as error
    # These items have forecast_data, ai_prospects, or valid category set by AI
    recovered = c.execute("""
        UPDATE revisions 
        SET ai_analyzed = 1,
            ai_summary = CASE 
                WHEN ai_summary = 'Processing Error' AND ai_prospects IS NOT NULL 
                THEN ai_prospects  
                ELSE ai_summary 
            END
        WHERE ai_analyzed = 2
          AND (
              forecast_data IS NOT NULL
              OR ai_prospects IS NOT NULL  
              OR (is_upward IS NOT NULL AND revision_rate_op IS NOT NULL AND revision_rate_op != 0)
              OR (dividend_forecast_annual IS NOT NULL AND dividend_forecast_annual > 0)
          )
    """)
    recovered_count = c.rowcount
    print(f"✅ Recovered {recovered_count} items that had valid AI analysis but were marked as error")

    # Also fix items where ai_summary is 'Processing Error' but they are ai_analyzed=1
    # (shouldn't happen but just in case)
    fixed_summary = c.execute("""
        UPDATE revisions 
        SET ai_summary = COALESCE(ai_prospects, '解析完了')
        WHERE ai_analyzed = 1 
          AND ai_summary = 'Processing Error'
          AND ai_prospects IS NOT NULL
    """)
    print(f"✅ Fixed {c.rowcount} items with 'Processing Error' summary but valid ai_prospects")

    conn.commit()
    
    # Show stats
    stats = c.execute("""
        SELECT 
            ai_analyzed,
            COUNT(*) as cnt,
            SUM(CASE WHEN ai_summary = 'Processing Error' THEN 1 ELSE 0 END) as error_summary_cnt
        FROM revisions 
        GROUP BY ai_analyzed
    """).fetchall()
    print("\nCurrent status:")
    for row in stats:
        labels = {0: 'Pending', 1: 'Done', 2: 'Error'}
        print(f"  ai_analyzed={row[0]} ({labels.get(row[0], '?')}): {row[1]} items, {row[2]} with 'Processing Error' summary")

    conn.close()

if __name__ == "__main__":
    fix_overwritten()
