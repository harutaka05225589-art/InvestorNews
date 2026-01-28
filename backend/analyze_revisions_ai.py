import os
import time
import requests
import tempfile
import json
import sqlite3
import google.generativeai as genai
from database import get_db_connection
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

def analyze_revision_pdf(pdf_path, title):
    """
    Uploads PDF to Gemini and asks for analysis.
    Returns: { "is_upward": bool, "revision_rate_op": float, "summary": str } or None
    """
    try:
        # Upload file
        print(f"  Uploading PDF to Gemini...")
        sample_file = genai.upload_file(path=pdf_path, display_name="Revision PDF")
        
        # Wait for processing
        while sample_file.state.name == "PROCESSING":
            time.sleep(2)
            sample_file = genai.get_file(sample_file.name)
            
        # Define Prompt
        prompt = f"""
        あなたはプロの証券アナリストです。
        添付のPDF資料（企業の適時開示情報：{title}）を分析し、以下の情報をJSON形式で抽出してください。
        
        【重要ルール 判断基準】
        1. is_upward: 「投資家にとってポジティブな上方修正」かを厳格に判定。
           - **営業利益(Operating Profit)が前回予想より増額されている場合は true (必須)。**
           - **営業利益が減額されている場合は、売上が増えていても false (下方修正扱い)。**
           - 黒字転換は true。赤字転落・赤字拡大は false。
           - 配当修正のみで業績が変わらない場合は null (ニュートラル)。
           - **営業利益の修正率がマイナスなのに true にすることは絶対に禁止。**
           - **逆に、営業利益の修正率がプラス（増益）なら、原則として true (上方修正) とする。**
           
        2. revision_rate_op: 営業利益の修正率（%）。
           - 計算式: (今回予想 - 前回予想) / |前回予想| * 100
           - 前回予想がゼロや記載なしの場合は 0.0。
           - 小数点第1位まで（例: 12.5, -5.0）。
           
        3. summary: 修正の理由を「必ず」30文字以内で要約。
           - 空欄や「なし」は禁止。理由が明確でない場合は「業績動向を踏まえ修正」としてください。
           - 例: 「海外販売が好調で円安も寄与」「原材料高騰により利益圧迫」
           - 冒頭に「〜のため」と書くこと。

        Output Format (JSON only):
        {{
            "is_upward": true,
            "revision_rate_op": 10.5,
            "summary": "北米の好調により増益"
        }}
        """

        # Try multiple model names in order of preference (Based on user's available list)
        candidate_models = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-flash-latest",
            "gemini-1.5-flash", 
            "gemini-pro"
        ]
        
        response = None
        used_model = None
        
        for model_name in candidate_models:
            try:
                print(f"  Trying model: {model_name}...")
                model = genai.GenerativeModel(model_name=model_name)
                response = model.generate_content([sample_file, prompt])
                used_model = model_name
                break # Success
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "quota" in err_str:
                    print(f"  !! QUOTA EXCEEDED for {model_name} !!")
                    # If this is the last model, we should propagate this error to stop the script
                    if model_name == candidate_models[-1]:
                        raise Exception("QUOTA_EXCEEDED")
                    time.sleep(2) # Brief pause before next model
                    continue
                
                # 404 means model not found, keep trying.
                if "404" in err_str or "not found" in err_str:
                    continue
                else:
                    print(f"  Model {model_name} error: {e}")
                    continue
        
        if not response:
            print("  All model attempts failed.")
            return None

        print(f"  Success using {used_model}")
        
        # Extract JSON
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
            
        data = json.loads(text.strip())
        return data

    except Exception as e:
        if "QUOTA_EXCEEDED" in str(e):
            raise e # Create fatal error to stop script
        print(f"  Gemini Analysis Error: {e}")
        return None

def process_revisions():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Select unanalyzed revisions
    rows = c.execute("""
        SELECT id, ticker, company_name, title, source_url 
        FROM revisions 
        WHERE ai_analyzed = 0 
          AND source_url LIKE '%.pdf'
        ORDER BY revision_date DESC
        LIMIT 5
    """).fetchall()
    
    if not rows:
        print("No pending revisions to analyze.")
        conn.close()
        return

    print(f"Found {len(rows)} revisions to analyze.")

    for row in rows:
        rev_id = row['id']
        url = row['source_url']
        title = row['title']
        ticker = row['ticker']
        
        print(f"\nProcessing {ticker} ({rev_id}): {title}")
        
        try:
            # Download PDF
            print(f"  Downloading: {url}")
            res = requests.get(url, timeout=15)
            if res.status_code != 200:
                print(f"  Download failed: {res.status_code}")
                # Mark as 2 (Failed) to skip
                c.execute("UPDATE revisions SET ai_analyzed = 2, ai_summary = 'PDF Download Failed' WHERE id = ?", (rev_id,))
                conn.commit()
                continue
                
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(res.content)
                tmp_path = tmp.name
            
            # Analyze
            result = analyze_revision_pdf(tmp_path, title)
            
            os.remove(tmp_path)
            
            if result:
                is_upward = result.get('is_upward') 
                rate = result.get('revision_rate_op', 0.0)
                summary = result.get('summary', '解析不可')
                
                print(f"  Result: Up={is_upward}, Rate={rate}%, Sum={summary}")
                
                is_up_int = 1 if is_upward else 0 if is_upward is False else None
                
                c.execute("""
                    UPDATE revisions 
                    SET is_upward = ?, 
                        revision_rate_op = ?,
                        ai_summary = ?,
                        ai_analyzed = 1
                    WHERE id = ?
                """, (is_up_int, rate, summary, rev_id))
                conn.commit()
                print("  Saved to DB.")

                # Post to X
                if is_upward:
                    try:
                        from send_x import post_to_x
                        clean_title = title[:30] + "..." if len(title) > 30 else title
                        promo = "👉 https://rich-investor-news.com/revisions"
                        x_msg = f"📈 【AI速報: 上方修正判定】\n{ticker} {row['company_name']}\n\n💡 理由: {summary}\n\n{clean_title}\n\n📄 PDF: {url}\n\n{promo}\n#株 #決算 #上方修正"
                        
                        tweet_id = post_to_x(x_msg)
                        if tweet_id:
                            print(f"  -> Posted to X successfully: {tweet_id}")
                        else:
                            print("  -> Failed to post to X (Check logs)")
                    except Exception as e:
                        print(f"  -> Exception posting to X: {e}")
                else:
                    print(f"  -> Skip X post (Verdict: {'Down' if is_upward is False else 'Neutral'})")
                
            else:
                print("  Analysis returned No Data.")
                # Mark as 2 (Failed)
                c.execute("UPDATE revisions SET ai_analyzed = 2, ai_summary = 'Analysis Failed' WHERE id = ?", (rev_id,))
                conn.commit()
                
            # Sleep longer to be safe (15s)
            print("  Sleeping 15s to respect Rate Limits...")
            time.sleep(15)
            
        except Exception as e:
            if "QUOTA_EXCEEDED" in str(e):
                print("\n!!! CRITICAL: QUOTA EXCEEDED (429) !!!")
                print("Stopping script immediately to allow quota recovery.")
                print("Do NOT mark current row as failed, so it can be retried later.")
                conn.close()
                exit(1) # Exit with error code

            print(f"  Error processing row: {e}")
            try:
                c.execute("UPDATE revisions SET ai_analyzed = 2, ai_summary = 'Processing Error' WHERE id = ?", (rev_id,))
                conn.commit()
            except:
                pass
            
    conn.close()

if __name__ == "__main__":
    process_revisions()
