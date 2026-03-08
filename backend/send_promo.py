import os
import random
from send_x import post_to_x

MESSAGES = [
    "📈 【今日の業績修正速報】\n上方修正や下方修正を発表した銘柄をAIが瞬時に判定・要約。\n株価変動の「なぜ？」がすぐわかる投資家必携ツール。\n\n👉 最新の速報はこちら\nhttps://rich-investor-news.com/\n\n#日本株 #決算速報 #上方修正 #増配 #株式投資",
    "📅 決算スケジュールを見逃さない！\n注目の決算発表やIRイベントをカレンダー形式で一覧表示。\n来週の相場に向けた準備はここから。\n\n👉 IRカレンダーを見る\nhttps://rich-investor-news.com/calendar\n\n#決算発表 #日本株 #資産運用 #株式投資 #高配当株",
    "🔍 気になる銘柄の「最新評価」をチェック\n業績進捗、ライバル企業との比較、最新決算のAI要約まで一画面に集約。\n\n👉 銘柄を検索して分析する\nhttps://rich-investor-news.com/\n\n#業績修正 #銘柄分析 #株式投資 #投資初心者",
    "💡 投資のヒントは「毎日の業績修正」にあり！\n今日の株式市場が引けた後に発表された最新の業績修正一覧。\nAIによるポジティブ/ネガティブ判定で明日の注目銘柄を発掘。\n\n👉 今日の修正まとめ\nhttps://rich-investor-news.com/revisions/today\n\n#日本株 #決算速報 #投資家 #スイングトレード",
    "🏢 億り人・決算速報 (RIN)\n決算や業績修正などのIR情報を、最速で分かりやすくAI要約する情報サイト。\n個人投資家の「銘柄分析」を強力にサポートします！\n\n👉 サイトを見に行く\nhttps://rich-investor-news.com/\n\n#株式市場 #初心者投資家 #株式投資"
]

import datetime

LOCK_FILE = "last_promo_tweet.txt"

def send_promo():
    # 1. Check if we already tweeted recently (prevent duplicates)
    if os.path.exists(LOCK_FILE):
        try:
            with open(LOCK_FILE, "r") as f:
                last_time_str = f.read().strip()
                last_time = datetime.datetime.fromisoformat(last_time_str)
                
                # If less than 60 minutes ago, skip
                if datetime.datetime.now() - last_time < datetime.timedelta(minutes=60):
                    print(f"  [SKIP] Promo tweet already sent recently at {last_time}")
                    return
        except Exception as e:
            print(f"Error reading lock file: {e}")

    # 2. Update lock file FIRST (to prevent race conditions)
    # Even if posting fails, we wait another hour to be safe.
    with open(LOCK_FILE, "w") as f:
        f.write(datetime.datetime.now().isoformat())

    # 3. Post
    # 3. Post
    print("  [INFO] Sending promo tweet...")
    
    # Round-Robin Selection
    idx = 0
    index_file = "promo_index.txt"
    
    if os.path.exists(index_file):
        try:
            with open(index_file, "r") as f:
                content = f.read().strip()
                if content.isdigit():
                    idx = int(content)
        except Exception as e:
            print(f"  [WARN] Failed to read promo index: {e}")

    # Ensure index is within bounds
    if idx >= len(MESSAGES):
        idx = 0
        
    msg = MESSAGES[idx]
    
    # Calculate next index
    next_idx = (idx + 1) % len(MESSAGES)
    
    # Save next index
    try:
        with open(index_file, "w") as f:
            f.write(str(next_idx))
    except Exception as e:
        print(f"  [WARN] Failed to save promo index: {e}")

    print(f"  [INFO] Selected Message #{idx + 1}/{len(MESSAGES)}")
    tweet_id = post_to_x(msg)
    
    if tweet_id:
        print(f"  [SUCCESS] Tweet sent: {tweet_id}")
    else:
        print("  [ERROR] Failed to send tweet.")
            
if __name__ == "__main__":
    send_promo()
