import sqlite3

conn = sqlite3.connect('frontend/investor_news.db')
c = conn.cursor()

print("--- Users with LINE ID ---")
users = c.execute("SELECT id, nickname, line_user_id FROM users WHERE line_user_id IS NOT NULL").fetchall()
for u in users:
    print(f"ID: {u[0]}, Name: {u[1]}, LINE: ...{u[2][-4:]}")
    
    # Check Portfolio
    print(f"  Portfolio:")
    ports = c.execute("SELECT ticker FROM portfolio_transactions WHERE user_id = ?", (u[0],)).fetchall()
    if not ports:
        print("    (None)")
    else:
        for p in ports:
            print(f"    - {p[0]}")

    # Check Alerts
    print(f"  Alerts:")
    alerts = c.execute("SELECT ticker FROM alerts WHERE user_id = ?", (u[0],)).fetchall()
    if not alerts:
        print("    (None)")
    else:
        for a in alerts:
            print(f"    - {a[0]}")

conn.close()
