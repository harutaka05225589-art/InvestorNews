import sqlite3
import json
import os
from database import get_db_connection

def add_new_investors():
    conn = get_db_connection()
    c = conn.cursor()

    new_investors = [
        (
            "井村俊哉", 
            json.dumps(["Zeppy", "株芸人", "井村さん"]), 
            "徹底的な企業分析に基づくファンダメンタルズ投資", 
            "https://twitter.com/imuvill"
        ),
        (
            "五味大輔", 
            json.dumps(["Gomi Daisuke", "五味さん", "そーせい五味"]), 
            "数百億円を運用する伝説の個人投資家（長期・集中）", 
            "" # No official active Twitter for news scraping purposes usually
        )
    ]

    print("Adding new investors...")
    count = 0
    for name, aliases, style, twitter in new_investors:
        # Check duplicate by name
        exists = c.execute("SELECT id FROM investors WHERE name = ?", (name,)).fetchone()
        if not exists:
            c.execute('INSERT INTO investors (name, aliases, style_description, twitter_url) VALUES (?, ?, ?, ?)',
                      (name, aliases, style, twitter))
            print(f"Added: {name}")
            count += 1
        else:
            print(f"Skipped (Already exists): {name}")

    conn.commit()
    conn.close()
    print(f"Done. Added {count} investors.")

if __name__ == "__main__":
    add_new_investors()
