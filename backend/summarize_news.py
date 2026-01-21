import google.generativeai as genai
import sqlite3
import os
import time
from datetime import datetime, timedelta

# Config using environment variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def summarize_text(text):
    if not GEMINI_API_KEY:
        print("Skipping AI summary: GEMINI_API_KEY not set.")
        return None

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash') 

        prompt = f"""
        あなたはプロの金融アナリストです。
        以下のニュース記事を、個人投資家にとって重要なポイントに絞って、30文字〜50文字程度の「ひとこと要約」を作成してください。
        主観は入れず、事実のみを簡潔に伝えてください。
        
        記事:
        {text[:2000]} 
        """

        response = model.generate_content(prompt)
        return response.text.replace('\n', '').strip()
    except Exception as e:
        print(f"AI Summary Failed: {e}")
        return None

def process_news():
    print(f"[{datetime.now()}] Starting AI summarization...")
    conn = get_db_connection()
    c = conn.cursor()

    # Get recent news without summary
    one_day_ago = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
    
    # Selecting news created recently
    c.execute("SELECT id, title, summary, url FROM news_items WHERE created_at > ? AND (ai_summary IS NULL OR ai_summary = '') LIMIT 20", (one_day_ago,))
    news_items = c.fetchall()

    print(f"Found {len(news_items)} items to summarize.")

    for item in news_items:
        original_summary = item['summary'] or item['title']
        print(f"Summarizing: {item['title'][:20]}...")
        
        # Use existing summary or title as input
        ai_summary = summarize_text(original_summary)
        
        if ai_summary:
            print(f" -> Result: {ai_summary}")
            c.execute("UPDATE news_items SET ai_summary = ? WHERE id = ?", (ai_summary, item['id']))
            conn.commit()
            time.sleep(1) # Rate limit politeness

    conn.close()
    print("AI summarization complete.")

if __name__ == "__main__":
    process_news()
