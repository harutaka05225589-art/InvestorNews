"""
Reset failed/missing/skipped AI analysis items from the past 30 days so they can be re-analyzed.
"""
import sqlite3
import os
import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def reset_unobtained():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Define 30 days cutoff
    cutoff_date = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime('%Y-%m-%d')
    print(f"Targeting items since: {cutoff_date}")

    # 1. Reset items in last 30 days that are failed/skipped/empty
    # We target:
    # - ai_analyzed = 2 (Processing Error)
    # - ai_analyzed = 0 (Pending)
    # - ai_summary is NULL, empty, 'Processing Error', '過去データのためスキップ', or '解析スキップ'
    res = c.execute("""
        UPDATE revisions
        SET ai_analyzed = 0,
            retry_count = 0,
            ai_summary = NULL
        WHERE revision_date >= ?
          AND (
              ai_analyzed = 2
              OR ai_analyzed = 0
              OR ai_summary IS NULL
              OR ai_summary = ''
              OR ai_summary IN ('過去データのためスキップ', '解析スキップ', 'Processing Error')
          )
    """, (cutoff_date,))
    
    reset_count = c.rowcount
    print(f"✅ Reset {reset_count} revisions from the last 30 days for AI re-analysis.")

    conn.commit()

    # Show stats for the last 30 days
    stats = c.execute("""
        SELECT 
            ai_analyzed,
            COUNT(*) as cnt,
            SUM(CASE WHEN ai_summary IS NULL OR ai_summary = '' THEN 1 ELSE 0 END) as empty_summary_cnt
        FROM revisions 
        WHERE revision_date >= ?
        GROUP BY ai_analyzed
    """, (cutoff_date,)).fetchall()
    
    print("\nCurrent status of items from the last 30 days:")
    for row in stats:
        labels = {0: 'Pending (Ready for AI)', 1: 'Done (Analyzed)', 2: 'Error'}
        print(f"  ai_analyzed={row[0]} ({labels.get(row[0], '?')}): {row[1]} items ({row[2]} with empty summary)")

    conn.close()
    print("\n✅ Reset complete. Run the poller (pm2 restart tdnet_poller) to start processing.")

if __name__ == '__main__':
    reset_unobtained()
