"""
Repair database: Set ai_analyzed = 1 for any records that have valid analysis content
but are marked as ai_analyzed = 2 (Error) or ai_analyzed = 0 (Pending).
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def repair():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Repair records that have a valid ai_summary (meaning AI analysis succeeded and saved)
    c.execute("""
        UPDATE revisions
        SET ai_analyzed = 1
        WHERE ai_analyzed != 1
          AND ai_summary IS NOT NULL
          AND ai_summary != ''
          AND ai_summary NOT IN ('Processing Error', '過去データのためスキップ', '解析スキップ', '解析不可', 'Stat Report')
    """)
    repaired_by_summary = c.rowcount
    print(f"✅ Repaired {repaired_by_summary} records that had valid ai_summary but incorrect ai_analyzed status.")

    # 2. Repair records that have valid prospects
    c.execute("""
        UPDATE revisions
        SET ai_analyzed = 1
        WHERE ai_analyzed != 1
          AND ai_prospects IS NOT NULL
          AND ai_prospects != ''
          AND ai_prospects NOT IN ('Processing Error', '過去データのためスキップ', '解析スキップ', '解析不可')
    """)
    repaired_by_prospects = c.rowcount
    print(f"✅ Repaired {repaired_by_prospects} records that had valid ai_prospects but incorrect ai_analyzed status.")

    # 3. Clean up any remaining 'Processing Error' summaries if the record is repaired
    c.execute("""
        UPDATE revisions
        SET ai_summary = ai_prospects
        WHERE ai_analyzed = 1
          AND ai_summary = 'Processing Error'
          AND ai_prospects IS NOT NULL
          AND ai_prospects != ''
          AND ai_prospects NOT IN ('Processing Error', '過去データのためスキップ', '解析スキップ', '解析不可')
    """)
    cleaned_summaries = c.rowcount
    print(f"✅ Cleaned {cleaned_summaries} overwritten 'Processing Error' summaries using ai_prospects.")

    conn.commit()
    conn.close()
    print("\n✅ Repair complete.")

if __name__ == '__main__':
    repair()
