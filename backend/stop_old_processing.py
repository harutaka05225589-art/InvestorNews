"""
Emergency: Stop processing old items.
Only keep last 2 weeks (ai_analyzed=0) for reprocessing.
Mark everything older as ai_analyzed=1 with existing data, or skip with retry_count=3.
"""
import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def stop_old_processing():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 2 weeks ago
    cutoff = (datetime.now() - timedelta(days=14)).strftime('%Y-%m-%d')
    print(f"Cutoff date: {cutoff}")

    # Count items still pending
    total_pending = c.execute("SELECT COUNT(*) FROM revisions WHERE ai_analyzed = 0").fetchone()[0]
    old_pending = c.execute("SELECT COUNT(*) FROM revisions WHERE ai_analyzed = 0 AND revision_date < ?", (cutoff,)).fetchone()[0]
    recent_pending = total_pending - old_pending
    print(f"Total pending (ai_analyzed=0): {total_pending}")
    print(f"  Older than 2 weeks: {old_pending} (will be marked as skipped)")
    print(f"  Recent (last 2 weeks): {recent_pending} (will keep for processing)")

    # Mark old items: set ai_analyzed=1 with summary indicating they were skipped
    # Don't overwrite items that already have a valid ai_summary
    c.execute("""
        UPDATE revisions 
        SET ai_analyzed = 1, 
            ai_summary = CASE 
                WHEN ai_summary IS NOT NULL AND ai_summary != 'Processing Error' AND ai_summary != '' 
                THEN ai_summary 
                ELSE '過去データのためスキップ' 
            END,
            retry_count = 3
        WHERE ai_analyzed = 0 AND revision_date < ?
    """, (cutoff,))
    print(f"✅ Marked {c.rowcount} old items as skipped")

    # Also fix items currently locked as ai_analyzed=2 that are older than 2 weeks
    old_locked = c.execute("SELECT COUNT(*) FROM revisions WHERE ai_analyzed = 2 AND revision_date < ?", (cutoff,)).fetchone()[0]
    if old_locked > 0:
        c.execute("""
            UPDATE revisions 
            SET ai_analyzed = 1, 
                ai_summary = CASE 
                    WHEN ai_summary IS NOT NULL AND ai_summary != 'Processing Error' AND ai_summary != '' 
                    THEN ai_summary 
                    ELSE '過去データのためスキップ' 
                END,
                retry_count = 3
            WHERE ai_analyzed = 2 AND revision_date < ?
        """, (cutoff,))
        print(f"✅ Marked {c.rowcount} old locked items as skipped")

    conn.commit()

    # Show remaining
    remaining = c.execute("SELECT COUNT(*) FROM revisions WHERE ai_analyzed = 0").fetchone()[0]
    retry_remaining = c.execute("SELECT COUNT(*) FROM revisions WHERE ai_analyzed = 2 AND COALESCE(retry_count, 0) < 3").fetchone()[0]
    print(f"\nRemaining to process: {remaining} unanalyzed + {retry_remaining} retries")

    conn.close()

if __name__ == "__main__":
    stop_old_processing()
