import sqlite3

conn = sqlite3.connect('frontend/investor_news.db')
c = conn.cursor()

print("--- All Users ---")
users = c.execute("SELECT id, nickname, line_user_id FROM users").fetchall()
if not users:
    print("No users found.")
else:
    for u in users:
        lid = u[2] if u[2] else "(NULL)"
        if lid != "(NULL)":
            lid = f"...{lid[-4:]}"
        print(f"ID: {u[0]}, Name: {u[1]}, LINE: {lid}")

conn.close()
