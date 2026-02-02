import os
import sqlite3
import datetime
import yfinance as yf
import pandas as pd
from send_x import post_to_x

# Config
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def get_weekly_revision_ranking():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get revisions from last 7 days with valid revision rate
    seven_days_ago = (datetime.date.today() - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
    
    query = """
        SELECT ticker, company_name, revision_rate_op, title
        FROM revisions 
        WHERE revision_date >= ? AND revision_rate_op > 0
        ORDER BY revision_rate_op DESC
        LIMIT 20
    """
    rows = c.execute(query, (seven_days_ago,)).fetchall()
    conn.close()
    return rows

def send_ranking_tweet():
    top_revisions = get_weekly_revision_ranking()
    
    if not top_revisions:
        print("No revisions found this week. Skipping.")
        return

    print(f"Found {len(top_revisions)} revisions for ranking.")
    
    # --- Save to JSON for Frontend ---
    import json
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'public', 'data', 'weekly_ranking.json')
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    
    ranking_data = []
    for rank, row in enumerate(top_revisions, 1):
        ranking_data.append({
            "rank": rank,
            "ticker": row[0],
            "name": row[1],
            "change_pct": row[2]  # Using same key for frontend compatibility, but means Revision Rate
        })
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump({
            "updated_at": datetime.datetime.now().strftime('%Y-%m-%d %H:%M'), 
            "ranking": ranking_data,
            "type": "revision_rate" # Flag to indicate type
        }, f, ensure_ascii=False, indent=2)
    
    print(f"Saved ranking data to {json_path}")

    # --- Build Tweet ---
    # Top 5 for Tweet
    top_5 = top_revisions[:5]
    
    msg = "📊 今週の業績修正率ランキング TOP5 (営業利益)\n\n"
    
    for i, row in enumerate(top_5, 1):
        ticker = row[0]
        name = row[1]
        rate = row[2]
        # Format: 1. トヨタ (+15.2%)
        msg += f"{i}. {name} (+{rate:.1f}%)\n"
    
    msg += "\n▶ 全件ランキング\nhttps://rich-investor-news.com/revisions/ranking\n#日本株 #決算速報 #上方修正 #業績修正 #高配当株"
    
    print("--- Tweet Content ---")
    print(msg)
    print("---------------------")
    
    # Post
    try:
        post_to_x(msg)
        print("✅ Ranking tweet sent!")
    except Exception as e:
        print(f"❌ Failed to send ranking tweet: {e}")

if __name__ == "__main__":
    send_ranking_tweet()
