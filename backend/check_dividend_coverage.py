import sqlite3
import os
from collections import defaultdict

db_path = os.path.join('frontend', 'investor_news.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

# 1. unique tickers in dividend_history
c.execute("SELECT COUNT(DISTINCT ticker) FROM dividend_history")
dividend_tickers_count = c.fetchone()[0]

# 2. total tickers (using ir_events as proxy for 'all known stocks' or revisions)
c.execute("SELECT COUNT(DISTINCT ticker) FROM ir_events")
total_tickers_count = c.fetchone()[0]

# 3. Check depth of history
c.execute("SELECT ticker, COUNT(*) as cnt FROM dividend_history GROUP BY ticker")
rows = c.fetchall()

depth_counts = defaultdict(int)
for r in rows:
    # Assuming 1 row = 1 year or 1 period. 
    # If 5 years, we expect maybe 5 rows (annual) or 10 (semi-annual)?
    # Let's just count rows for now.
    depth_counts[r[1]] += 1

print(f"Tickers with Dividend History: {dividend_tickers_count}")
print(f"Total Tickers (in IR Events): {total_tickers_count}")

# Distribution
print("History Depth Distribution (Rows per Ticker):")
for k in sorted(depth_counts.keys()):
    print(f"  {k} rows: {depth_counts[k]} tickers")

conn.close()
