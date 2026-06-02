import os
import random
from send_x import post_to_x
from daily_limits import can_tweet, increment_tweets, remaining_tweets

MESSAGES = [
    "📈 【業績修正率ランキング】\n日本株の「上方修正」を修正率順にリストアップ！\nAIが修正理由を詳しく要約。明日の注目銘柄を今すぐチェック。\n\n👉 ランキングを見る\nhttps://rich-investor-news.com/revision-rate-ranking\n\n#日本株 #決算速報 #上方修正 #投資家 #株式投資",
    "💰 【高配当・増配銘柄は？】\n最新の「増配ランキング」を最速更新。\n配当利回りや増配率をAIが自動集計。インカムゲイン狙いの投資家必見！\n\n👉 増配銘柄の一覧へ\nhttps://rich-investor-news.com/dividend-increase-stocks\n\n#高配当株 #増配 #新NISA #日本株 #資産運用",
    "🚀 【自社株買い発表を逃さない】\n今日の市場で自社株買いを発表した銘柄は？\n買い付け規模や期間をAIが瞬時に解析。\n\n👉 自社株買い銘柄を見る\nhttps://rich-investor-news.com/share-buyback-stocks\n\n#自社株買い #日本株 #株主還元 #スイングトレード",
    "📅 【今週の決算スケジュール】\n今週発表予定の重要決算を一覧表示。\n保有銘柄の発表日を事前に確認して、決算またぎに備えよう！\n\n👉 決算予定をチェック\nhttps://rich-investor-news.com/earnings-this-week\n\n#決算発表 #IRカレンダー #日本株 #投資準備",
    "👤 【著名投資家の最新動向】\n「あの億り人」が買い増した銘柄は？\n大量保有報告書をもとに、主要株主の変動を一覧化。\n\n👉 投資家の買い増しを見る\nhttps://rich-investor-news.com/investor-buying\n\n#億り人 #テスタ #大量保有報告書 #日本株",
    "🏢 【億り人・決算速報 (RIN)】\nTDnet開示をAIが瞬時に要約。個人投資家のための「情報の時差」をなくす最強ツール。\n\n👉 サイトを見に行く\nhttps://rich-investor-news.com/\n\n#株式投資 #決算速報 #RIN #投資初心者"
]

import datetime

LOCK_FILE = "last_promo_tweet.txt"

def send_promo():
    # 0. Check daily tweet limit (promo is lowest priority)
    if not can_tweet():
        print(f"  [SKIP] Daily tweet limit reached ({remaining_tweets()} remaining). No promo tweet today.")
        return

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
        increment_tweets()
    else:
        print("  [ERROR] Failed to send tweet.")
            
if __name__ == "__main__":
    send_promo()
