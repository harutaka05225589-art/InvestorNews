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

MESSAGES = [
    "【日本株投資家の皆様へ】\n決算発表ラッシュで情報収集に疲れていませんか？\n『(RIN) 億り人・決算速報』は、TDnetで発表されたIRニュースや決算短信をAIが瞬時に解析し、あなたに代わって重要なポイントを要約します！\n\n💡 さらに超便利な「LINE通知機能」を搭載！\nあなたの保有銘柄や、気になるウォッチリスト銘柄を登録しておくだけで、\n目標株価への到達や、重要な決算発表の予定を**あなたのLINEに直接**お知らせします。\n\n・もう相場に張り付く必要はありません\n・見逃しによる機会損失を防ぎます\n・すべて無料で利用可能！\n\n👇今すぐサイトにアクセスしてLINE連携を済ませましょう👇\nhttps://rich-investor-news.com/\n\n#日本株 #決算速報 #高配当株 #自社株買い #株式投資",
    "【サプライズ決算を最速でキャッチ📈】\n『(RIN) 億り人・決算速報』では、日本株の上方修正や増配、自社株買いなどの激アツIR情報をAIが自動でリストアップ！\n修正率ランキングや増配ランキングで、明日の注目銘柄が一目で分かります👀\n\n📲 **最強の機能：LINE自動アラート**\n保有銘柄の株価が急落した時や、指定した目標株価を達成した時に、LINEへ即座に通知を飛ばすことができます。\n「あの銘柄、いつの間にか上がってた…」という後悔はもうなくなります。\n\n仕事中や外出先でもLINEで相場の変動をしっかりキャッチ！\n👇無料登録＆LINE連携はこちらから👇\nhttps://rich-investor-news.com/\n\n#投資初心者 #株主還元 #スイングトレード #上方修正 #増配",
    "【もう決算またぎで失敗しない📅】\n今週の決算発表スケジュール、しっかり把握できていますか？\n『(RIN) 億り人・決算速報』なら、直近の重要決算カレンダーを網羅！\n\n🔔 **超おすすめ！LINE決算リマインダー**\n事前に銘柄をウォッチリストに登録しておけば、「明日、保有銘柄の〇〇の決算発表です！」というリマインドがあなたのLINEに自動で届きます。\n決算日を忘れて持ち越してしまい、翌日のストップ安で被弾…という事故を完全に防げます🛡️\n\nさらに、各種IRニュースのAI要約機能で、難解な決算書を読む手間も省けます。\n👇まずは無料でLINE連携を試してみてください👇\nhttps://rich-investor-news.com/\n\n#決算スケジュール #日本株 #資産運用 #FIRE #投資家さんと繋がりたい"
]

LOCK_FILE = os.path.join(BASE_DIR, "last_promo_tweet.txt")
INDEX_FILE = os.path.join(BASE_DIR, "promo_index.txt")

def send_promo():
    print(f"  [INFO] send_promo() called at {datetime.datetime.now(JST).strftime('%Y-%m-%d %H:%M:%S JST')}")

    # 1. Check if we already tweeted today (prevent duplicates on the same day)
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

    # 2. Select message (round-robin)
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

    # Save next index
    next_idx = (idx + 1) % len(MESSAGES)
    try:
        with open(INDEX_FILE, "w") as f:
            f.write(str(next_idx))
    except Exception as e:
        print(f"  [WARN] Failed to save promo index: {e}")

    # 3. Post to X
    print(f"  [INFO] Posting promo tweet #{idx + 1}/{len(MESSAGES)}...")
    tweet_id = post_to_x(msg, is_promo=True)

    if tweet_id:
        print(f"  [SUCCESS] Tweet sent: {tweet_id}")
        # Write today's date to lock file (1 promo per day)
        with open(LOCK_FILE, "w") as f:
            f.write(today_str)
    else:
        print("  [ERROR] Failed to send tweet via X API.")

if __name__ == "__main__":
    send_promo()
