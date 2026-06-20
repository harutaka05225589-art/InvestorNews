import os
import random
from send_x import post_to_x
from daily_limits import can_tweet, increment_tweets, remaining_tweets

MESSAGES = [
    "【日本株投資家の皆様へ】\n決算発表ラッシュで情報収集に疲れていませんか？\n『(RIN) 億り人・決算速報』は、TDnetで発表されたIRニュースや決算短信をAIが瞬時に解析し、あなたに代わって重要なポイントを要約します！\n\n💡 さらに超便利な「LINE通知機能」を搭載！\nあなたの保有銘柄や、気になるウォッチリスト銘柄を登録しておくだけで、\n目標株価への到達や、重要な決算発表の予定を**あなたのLINEに直接**お知らせします。\n\n・もう相場に張り付く必要はありません\n・見逃しによる機会損失を防ぎます\n・すべて無料で利用可能！\n\n👇今すぐサイトにアクセスしてLINE連携を済ませましょう👇\nhttps://rich-investor-news.com/\n\n#日本株 #決算速報 #高配当株 #自社株買い #株式投資",
    "【サプライズ決算を最速でキャッチ📈】\n『(RIN) 億り人・決算速報』では、日本株の上方修正や増配、自社株買いなどの激アツIR情報をAIが自動でリストアップ！\n修正率ランキングや増配ランキングで、明日の注目銘柄が一目で分かります👀\n\n📲 **最強の機能：LINE自動アラート**\n保有銘柄の株価が急落した時や、指定した目標株価を達成した時に、LINEへ即座に通知を飛ばすことができます。\n「あの銘柄、いつの間にか上がってた…」という後悔はもうなくなります。\n\n仕事中や外出先でもLINEで相場の変動をしっかりキャッチ！\n👇無料登録＆LINE連携はこちらから👇\nhttps://rich-investor-news.com/\n\n#投資初心者 #株主還元 #スイングトレード #上方修正 #増配",
    "【もう決算またぎで失敗しない📅】\n今週の決算発表スケジュール、しっかり把握できていますか？\n『(RIN) 億り人・決算速報』なら、直近の重要決算カレンダーを網羅！\n\n🔔 **超おすすめ！LINE決算リマインダー**\n事前に銘柄をウォッチリストに登録しておけば、「明日、保有銘柄の〇〇の決算発表です！」というリマインドがあなたのLINEに自動で届きます。\n決算日を忘れて持ち越してしまい、翌日のストップ安で被弾…という事故を完全に防げます🛡️\n\nさらに、各種IRニュースのAI要約機能で、難解な決算書を読む手間も省けます。\n👇まずは無料でLINE連携を試してみてください👇\nhttps://rich-investor-news.com/\n\n#決算スケジュール #日本株 #資産運用 #FIRE #投資家さんと繋がりたい"
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
