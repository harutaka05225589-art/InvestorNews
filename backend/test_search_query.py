import sqlite3

conn = sqlite3.connect('C:/Users/haruya/InvesterNews/frontend/investor_news.db')
c = conn.cursor()

# Test exact full-width query "７２０３"
print("Querying for ７２０３ (full width):")
res = c.execute("SELECT code as ticker, name FROM companies WHERE code LIKE '%７２０３%' OR name LIKE '%７２０３%'").fetchall()
print(res)

# Test exact query "7203"
print("Querying for 7203 (half width):")
res = c.execute("SELECT code as ticker, name FROM companies WHERE code LIKE '%7203%' OR name LIKE '%7203%'").fetchall()
print(res)

# Test english names
print("Querying for toyota:")
res = c.execute("SELECT code as ticker, name FROM companies WHERE code LIKE '%toyota%' OR name LIKE '%toyota%'").fetchall()
print(res)

# Test english names uppercase
print("Querying for TOYOTA:")
res = c.execute("SELECT code as ticker, name FROM companies WHERE code LIKE '%TOYOTA%' OR name LIKE '%TOYOTA%'").fetchall()
print(res)
