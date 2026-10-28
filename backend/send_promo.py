import os
import random
import datetime
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo
from send_x import post_to_x

JST = ZoneInfo("Asia/Tokyo")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Paused per operator decision (set True to re-enable X promo posts)
PROMO_ENABLED = False

MESSAGES = [
    "【日本株投資家の皆様へ】\n決算発表ラッシュで情報収集に疲れていませんか？\n『(RIN) 億り人・決算速報』は、TDnetで発表されたIRニュースや決算短信をAIが瞬時に解析し、重要なポイントをわかりやすく要約します！\n\n・アカウント登録不要・完全無料\n・上方修正・増配・自社株買いを即時判定\n・著名投資家の大量保有報告も網羅\n\n👇今すぐ最新速報をチェック👇\nhttps://rich-investor-news.com/\n\n#日本株 #決算速報 #高配当株 #自社株買い #株式投資",
    "【サプライズ決算を最速でキャッチ📈】\n『(RIN) 億り人・決算速報』では、日本株の上方修正や増配、自社株買いなどの注目IR情報をAIが自動でリストアップ！\n修正率ランキングや増配ランキングで、注目銘柄が一目で分かります👀\n\n会員登録なしですべて無料でご覧いただけます。\n👇最新の業績修正ランキングはこちら👇\nhttps://rich-investor-news.com/\n\n#投資初心者 #株主還元 #スイングトレード #上方修正 #増配",
    "【今週の決算スケジュールを網羅📅】\n今週の決算発表スケジュール、しっかり把握できていますか？\n『(RIN) 億り人・決算速報』なら、プライム・スタンダード・グロース別の決算カレンダーや各種IRニュースのAI要約を登録不要・無料で確認できます！\n\n👇決算カレンダーはこちら👇\nhttps://rich-investor-news.com/calendar\n\n#決算スケジュール #日本株 #資産運用 #FIRE #株式投資"
]

LOCK_FILE = os.path.join(BASE_DIR, "last_promo_tweet.txt")
INDEX_FILE = os.path.join(BASE_DIR, "promo_index.txt")

def send_promo():
    if not PROMO_ENABLED:
        print("  [PAUSED] Promo tweets are currently paused (PROMO_ENABLED = False).")
        return

    print(f"  [INFO] send_promo() called at {datetime.datetime.now(JST).strftime('%Y-%m-%d %H:%M:%S JST')}")

    today_str = datetime.datetime.now(JST).strftime("%Y-%m-%d")
    if os.path.exists(LOCK_FILE):
        try:
            with open(LOCK_FILE, "r") as f:
                last_date_str = f.read().strip()
                if last_date_str == today_str:
                    print(f"  [SKIP] Promo tweet already sent today ({today_str})")
                    return
        except Exception as e:
            print(f"  [WARN] Error reading lock file: {e}")

    idx = 0
    if os.path.exists(INDEX_FILE):
        try:
            with open(INDEX_FILE, "r") as f:
                content = f.read().strip()
                if content.isdigit():
                    idx = int(content)
        except Exception as e:
            print(f"  [WARN] Failed to read promo index: {e}")

    if idx >= len(MESSAGES):
        idx = 0

    msg = MESSAGES[idx]

    next_idx = (idx + 1) % len(MESSAGES)
    try:
        with open(INDEX_FILE, "w") as f:
            f.write(str(next_idx))
    except Exception as e:
        print(f"  [WARN] Failed to save promo index: {e}")

    print(f"  [INFO] Posting promo tweet #{idx + 1}/{len(MESSAGES)}...")
    tweet_id = post_to_x(msg, is_promo=True)

    if tweet_id:
        print(f"  [SUCCESS] Tweet sent: {tweet_id}")
        with open(LOCK_FILE, "w") as f:
            f.write(today_str)
    else:
        print("  [ERROR] Failed to send tweet via X API.")

if __name__ == "__main__":
    send_promo()
