import sqlite3
import os

# The actual DB is located at frontend/investor_news.db relative to the project root
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "investor_news.db")

def reset_shareholders():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Check current state
    c.execute("SELECT COUNT(*) FROM stock_shareholders")
    total = c.fetchone()[0]
    print(f"現在の株主データ件数: {total}件")
    
    if total > 0:
        print("誤ったカラムで取得したデータを全削除します...")
        c.execute("DELETE FROM stock_shareholders")
        conn.commit()
        print("削除完了しました。週末の自動更新で正しいデータが入り直します。")
        print("すぐに最新を取得したい場合は `python backend/update_all_shareholders.py` を実行してください。")
    else:
        print("データがありませんでした。")
        
    conn.close()

if __name__ == "__main__":
    reset_shareholders()
