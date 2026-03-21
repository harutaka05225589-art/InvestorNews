import sqlite3

conn = sqlite3.connect('frontend/investor_news.db')
c = conn.cursor()

print('--- companies ---')
c.execute("SELECT ticker, name, sector FROM companies WHERE ticker IN ('8957', '2083', '1493', '1498', '2084', '2256')")
for row in c.fetchall():
    print(row)

print('--- revisions ---')
c.execute("SELECT ticker, company_name FROM revisions WHERE ticker IN ('8957', '2083', '1493', '1498', '2084', '2256') LIMIT 10")
for row in c.fetchall():
    print(row)
