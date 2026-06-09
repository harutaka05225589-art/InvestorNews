"""
One-shot script: Reset last 7 days' failed analyses ('解析不可') for re-analysis.
This script ONLY resets DB flags. It does NOT call the AI API itself.
The poller (tdnet_poller) will pick up the reset items automatically.

Safety:
- Runs once and exits (no loop)
- Only targets ai_summary = '解析不可' or 'Processing Error' from the past 7 days
- Does NOT touch successfully analyzed items (ai_analyzed=1 with valid summaries)
"""
import sqlite3
import os
import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def reset_week():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    cutoff_date = (datetime.datetime.now() - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
    print(f"Target: items from {cutoff_date} to today")

    # 1. Show current state BEFORE reset
    stats_before = c.execute("""
        SELECT ai_analyzed, ai_summary, COUNT(*) as cnt
        FROM revisions 
        WHERE revision_date >= ?
        GROUP BY ai_analyzed, ai_summary
        ORDER BY cnt DESC
    """, (cutoff_date,)).fetchall()

    print("\n--- Current state (last 7 days) ---")
    total = 0
    target_count = 0
    for row in stats_before:
        status_label = {0: 'Pending', 1: 'Done', 2: 'Error'}.get(row['ai_analyzed'], '?')
        summary_preview = (row['ai_summary'] or 'NULL')[:40]
        print(f"  ai_analyzed={row['ai_analyzed']} ({status_label}), summary='{summary_preview}': {row['cnt']} items")
        total += row['cnt']
        if row['ai_summary'] in ('解析不可', 'Processing Error', 'Invalid URL', 'Stat Report', None, ''):
            if row['ai_analyzed'] != 0:  # Don't double-count already pending
                target_count += row['cnt']
    print(f"  Total: {total} items")

    # 2. Reset ONLY failed items
    res = c.execute("""
        UPDATE revisions
        SET ai_analyzed = 0,
            retry_count = 0
        WHERE revision_date >= ?
          AND (
              ai_summary IN ('解析不可', 'Processing Error')
              OR (ai_analyzed = 2)
          )
    """, (cutoff_date,))

    reset_count = res.rowcount
    conn.commit()

    print(f"\n✅ Reset {reset_count} items for re-analysis.")

    # 3. Show state AFTER reset
    stats_after = c.execute("""
        SELECT ai_analyzed, COUNT(*) as cnt
        FROM revisions 
        WHERE revision_date >= ?
        GROUP BY ai_analyzed
    """, (cutoff_date,)).fetchall()

    print("\n--- After reset ---")
    for row in stats_after:
        status_label = {0: 'Pending (will be re-analyzed)', 1: 'Done (untouched)', 2: 'Error'}.get(row['ai_analyzed'], '?')
        print(f"  ai_analyzed={row['ai_analyzed']} ({status_label}): {row['cnt']} items")

    conn.close()
    print("\n✅ Done. The poller will pick these up automatically (10 items per cycle, 60s interval).")
    print(f"   Estimated time to complete: ~{(reset_count // 10 + 1)} minutes")

if __name__ == '__main__':
    reset_week()
