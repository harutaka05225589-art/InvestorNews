import os
import sqlite3
import warnings
# Suppress Google Gemini depreciation warning
warnings.filterwarnings("ignore", category=FutureWarning)

import google.generativeai as genai
from dotenv import load_dotenv
from database import get_db_connection

# Load API Key
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# model = genai.GenerativeModel('gemini-2.0-flash-exp')
model = genai.GenerativeModel('gemini-1.5-flash')

def get_or_create_profile(ticker, company_name):
    """
    Fetch profile from DB. If not exists, generate with AI and save.
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    # 1. Check DB
    row = c.execute("SELECT description, sector FROM stock_profiles WHERE ticker = ?", (ticker,)).fetchone()
    if row and row['description']:
        conn.close()
        return {
            "description": row['description'],
            "sector": row['sector']
        }
    
    # 2. Generate with AI
    print(f"Generating profile for {company_name} ({ticker})...")
    try:
        prompt = f"""
        あなたはプロの証券アナリストです。
        以下の日本企業の「企業概要」と「セクター（業種）」を教えてください。

        企業名: {company_name}
        証券コード: {ticker}

        【出力フォーマット】
        以下のJSON形式のみを出力してください。余計な文章は不要です。
        {{
            "description": "3行程度の簡潔な企業概要（何をしている会社か、強みは何か）。一般投資家向けにわかりやすく。",
            "sector": "東証33業種または一般的な業種名（例: 輸送用機器、情報・通信業）"
        }}
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up JSON (sometimes Gemini adds ```json ... ```)
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        
        import json
        data = json.loads(text)
        
        description = data.get("description", "情報が取得できませんでした")
        sector = data.get("sector", "その他")
        
        # 3. Save to DB
        c.execute("""
            INSERT OR REPLACE INTO stock_profiles (ticker, company_name, description, sector, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (ticker, company_name, description, sector))
        conn.commit()
        print(f"Saved profile for {ticker}.")
        
        conn.close()
        return data

    except Exception as e:
        print(f"Error generating profile: {e}")
        conn.close()
        return None

if __name__ == "__main__":
    # Test
    print(get_or_create_profile("7203", "トヨタ自動車"))
