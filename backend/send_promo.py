import os
import random
from send_x import post_to_x

MESSAGES = [
    "📅 今週の決算発表予定を確認！\n注目企業のスケジュールをチェックして投資チャンスを逃さない。\n\n👉 https://rich-investor-news.com/calendar\n#株式投資 #決算スケジュール #日本株 #日経平均 #TOPIX",
    "🔔 大量保有報告書から見る「大口投資家」の動向\n機関投資家や著名投資家のポートフォリオ変化を分析。\n\n👉 https://rich-investor-news.com/introduction\n#日本株 #大量保有報告書 #機関投資家 #株式市場",
    "📈 【業績修正速報】\n上方修正や増配を発表した銘柄をAIが即座に判定・要約。\n\n👉 https://rich-investor-news.com/revisions\n#決算速報 #上方修正 #増配 #高配当株 #好決算",
    "📱 欲しい情報だけをLINEで通知\n監視銘柄の「決算」「修正」「株価」をリアルタイムで受け取れます。\n\nアクセスはこちら👇\nhttps://rich-investor-news.com\n#株式投資 #投資ツール #日本株 #資産運用",
    "💰 配当管理をアップグレード\n「受取ベース」と「権利ベース」の切り替え、資産推移チャートで高度な管理を。\n\n👉 https://rich-investor-news.com/portfolio\n#配当金 #配当生活 #高配当株 #資産形成 #NISA"
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

    # 2. Post
    msg = random.choice(MESSAGES)
    tweet_id = post_to_x(msg)
    
    # 3. Update lock file
    if tweet_id:
        with open(LOCK_FILE, "w") as f:
            f.write(datetime.datetime.now().isoformat())
            
if __name__ == "__main__":
    send_promo()
