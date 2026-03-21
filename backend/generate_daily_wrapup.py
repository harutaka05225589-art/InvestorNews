import os
import sqlite3
import datetime
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)
genai.configure(api_key=GEMINI_API_KEY)

def generate_report():
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Fetch today's revisions
    c.execute("""
        SELECT r.ticker, c.name, r.title as doc_title, r.is_upward, r.category, r.revision_rate_op, r.ai_summary, r.ai_prospects 
        FROM revisions r
        LEFT JOIN companies c ON r.ticker = c.ticker
        WHERE r.revision_date LIKE ? 
        ORDER BY r.revision_rate_op DESC
        LIMIT 20
    """, (f"{today}%",))
    
    revisions = c.fetchall()
    
    # Also fetch recent ones if today has none (for testing mostly)
    if not revisions:
        print(f"No revisions found for {today}. Fetching the most recent 10 records as fallback for testing...")
        c.execute("""
            SELECT r.ticker, c.name, r.title as doc_title, r.is_upward, r.category, r.revision_rate_op, r.ai_summary, r.ai_prospects, r.revision_date 
            FROM revisions r
            LEFT JOIN companies c ON r.ticker = c.ticker
            ORDER BY r.revision_date DESC
            LIMIT 10
        """)
        revisions = c.fetchall()
        if revisions:
            today = revisions[0]['revision_date'][:10] # Use the date of the most recent revision for testing
            print(f"Using date {today} instead.")
        else:
             print("No revisions in database at all. Exiting.")
             conn.close()
             return

    # Prepare data for prompt
    revisions_text = ""
    for r in revisions:
        revisions_text += f"- 銘柄: {r['name']} ({r['ticker']})\n"
        revisions_text += f"  - 分類: {'上方修正' if r['is_upward'] else 'その他'} / {r['category']}\n"
        if r['revision_rate_op']:
            revisions_text += f"  - 営業利益修正率: {r['revision_rate_op']}%\n"
        if r['ai_summary']:
            revisions_text += f"  - 内容: {r['ai_summary']}\n"
        if r['ai_prospects']:
            revisions_text += f"  - 将来性: {r['ai_prospects']}\n"
        revisions_text += "\n"

    prompt = f"""
    あなたはプロの金融ライター・証券アナリストです。
    指定された日の日本株市場で発表された主要な業績修正（適時開示）データを元に、証券会社のレポートや投資ブログのような実践的で読み応えのあるまとめ記事を作成してください。
    最終出力は以下のJSON形式のみとします。
    
    {{
        "title": "記事のタイトル（SEOとSNSでのクリック率を意識し、具体的な銘柄名やインパクトのあるキーワードを含める。30文字程度）",
        "content_md": "記事の本文（マークダウン形式。<h2>, <h3> を適切に使い、主要銘柄の解説や今日の市場の総括を2000文字以上で充実させてください）"
    }}

    【構成案の例】
    - 今日の相場概況（上方修正の傾向や目立ったセクターについて）
    - 注目銘柄ピックアップ（具体的な修正理由、将来性とリスクの解説）
    - 明日の投資戦略に向けたワンポイントアドバイス

    【入力データ（{today}の発表）】
    {revisions_text}
    """

    print("Generating report with Gemini...")
    model = genai.GenerativeModel('gemini-2.5-pro')
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(response_mime_type="application/json")
    )
    
    try:
        result = json.loads(response.text)
        title = result.get('title')
        content_md = result.get('content_md')
        
        c.execute("""
            INSERT INTO daily_reports (date_str, title, content_md)
            VALUES (?, ?, ?)
            ON CONFLICT(date_str) DO UPDATE SET title=excluded.title, content_md=excluded.content_md
        """, (today, title, content_md))
        conn.commit()
        print(f"Successfully saved daily report for {today}: {title}")
    except Exception as e:
        print(f"Error parsing or saving report: {e}")
        print("Raw response:", response.text)
    
    conn.close()

if __name__ == "__main__":
    generate_report()
