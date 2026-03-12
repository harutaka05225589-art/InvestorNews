import os
import sqlite3
import datetime
import google.generativeai as genai
from database import get_db_connection
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

def generate_market_summary(date_str=None):
    """
    Aggregates all revision summaries for a given date and generates a market summary using Gemini.
    """
    if date_str is None:
        date_str = datetime.date.today().strftime('%Y-%m-%d')

    conn = get_db_connection()
    c = conn.cursor()

    # 1. Fetch all revision summaries for the date
    # Only include records where AI summary exists
    c.execute("""
        SELECT ticker, company_name, is_upward, category, ai_summary 
        FROM revisions 
        WHERE revision_date = ? AND ai_summary IS NOT NULL AND ai_summary != ''
    """, (date_str,))
    revisions = c.fetchall()

    if not revisions:
        print(f"No AI-summarized revisions found for {date_str}. Skipping market summary.")
        conn.close()
        return None

    # 2. Format the input for Gemini
    disclosure_list = []
    upward_count = 0
    downward_count = 0
    buyback_count = 0

    for rev in revisions:
        sentiment = "ポジティブ (上方修正/増配)" if rev['is_upward'] else "ネガティブ (下方修正/減配)"
        if rev['category'] == 'buyback':
            sentiment = "自社株買い"
            buyback_count += 1
        elif rev['is_upward']:
            upward_count += 1
        else:
            downward_count += 1
            
        disclosure_list.append(f"- {rev['company_name']} ({rev['ticker']}): {rev['ai_summary']} [{sentiment}]")

    disclosure_text = "\n".join(disclosure_list)
    total_count = len(revisions)

    # 3. Define the Prompt
    prompt = f"""
    あなたは凄腕の株式証券アナリストです。本日の適時開示情報（業績修正や配当修正）を分析し、
    投資が今日の市場の「全体のトレンド」を一瞬で把握できるような概況文を生成してください。

    【統計データ】
    対象日: {date_str}
    全開示数: {total_count}件
    ポジティブ（上方修正・増配等）: {upward_count}件
    ネガティブ（下方修正・減配等）: {downward_count}件
    自社株買い: {buyback_count}件

    【開示内容リスト】
    {disclosure_text}

    【出力ルール】
    1. 文字数は120〜150文字程度。
    2. 個別の銘柄名よりも「セクターの傾向」や「共通の要因（為替、原材料価格、特定の需要増など）」を重視して要約。
    3. 「～という傾向が見られます」「～が目立つ一日でした」といった自然で力強いアナリスト風の日本語。
    4. 市場のムードが「強気（ポジティブ）」か「弱気（ネガティブ）」か「混在」かが分かるように。
    5. HTMLタグは含めず、プレーンテキストのみで出力。
    """

    # 4. Generate Content
    try:
        print(f"Generating market summary for {total_count} items on {date_str}...")
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        summary_text = response.text.strip()

        if not summary_text:
            print("Failed to generate summary text.")
            conn.close()
            return None

        # 5. Save to DB
        c.execute("""
            INSERT INTO market_summaries (date, summary_text, generated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(date) DO UPDATE SET
                summary_text=excluded.summary_text,
                generated_at=CURRENT_TIMESTAMP
        """, (date_str, summary_text))
        
        conn.commit()
        print(f"Market summary saved for {date_str}.")
        conn.close()
        return summary_text

    except Exception as e:
        print(f"Error generating market summary: {e}")
        conn.close()
        return None

if __name__ == "__main__":
    # If a date is passed as argument, use it
    import sys
    target_date = sys.argv[1] if len(sys.argv) > 1 else None
    generate_market_summary(target_date)
