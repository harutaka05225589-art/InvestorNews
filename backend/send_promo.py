import os
import random
from send_x import post_to_x

MESSAGES = [
    "📅 今週の決算スケジュールはもう確認しましたか？\n注目企業の発表日を逃さないようチェックしましょう！\n\n👉 https://rich-investor-news.com/calendar\n#株式投資 #決算 #IRカレンダー #日本株 #投資家さんと繋がりたい",
    "🔔 著名投資家が何を買っているか気になりませんか？\n大量保有報告書をもとにしたポートフォリオ分析を無料公開中！\n\n👉 https://rich-investor-news.com/introduction\n#個人投資家 #日本株 #投資初心者 #大量保有報告書",
    "📈 業績予想の修正（上方修正）をリアルタイムでキャッチ！\n投資チャンスを逃さないためのツールです。\n\n👉 https://rich-investor-news.com/revisions\n#決算速報 #上方修正 #株式投資 #高配当株",
    "📱 LINE通知機能も実装済み！\n気になった銘柄をウォッチリストに登録して、最新情報をスマホで受け取ろう。\n\nアクセスはこちら👇\nhttps://rich-investor-news.com\n#株クラ #日本株 #投資家"
]

def send_promo():
    msg = random.choice(MESSAGES)
    post_to_x(msg)

if __name__ == "__main__":
    send_promo()
