import os
import time
import requests
import tempfile
import json
import sqlite3
import google.generativeai as genai
from database import get_db_connection
from dotenv import load_dotenv

load_dotenv()

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
            
        if sample_file.state.name == "FAILED":
            print("  Gemini File processing failed.")
            return None

        # model = genai.GenerativeModel(model_name="gemini-1.5-flash") # Cost effective
        model = genai.GenerativeModel(model_name="gemini-2.0-flash-exp") # Latest if available, or 1.5-flash
        # Fallback to 1.5-flash for stability
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")

        prompt = f"""
        あなたはプロの証券アナリストです。
        添付のPDF資料（企業の適時開示情報：{title}）を分析し、以下の情報をJSON形式で抽出してください。

        1. is_upward: 今回の修正が「上方修正」なら true、「下方修正」なら false。「配当のみ修正」や「ニュートラル」な場合は null。
           - 売上高、営業利益、経常利益、純利益のいずれかが前回予想より増額されていれば true とみなす。
           - 全て減額なら false。
        2. revision_rate_op: 営業利益(Operating Profit)の修正率（%）。
           - (今回予想 - 前回予想) / 前回予想 * 100
           - 営業利益の記載がない場合や、黒字転換/赤字転落で計算できない場合は 0.0 とする。
           - 小数点第1位まで（例: 12.5, -5.0）
        3. summary: 修正の理由を「30文字以内」で簡潔に要約。
           - 例: 「海外販売が好調で円安も寄与」「原材料高騰により利益圧迫」など。

        Output Format (JSON only):
        {{
            "is_upward": true,
            "revision_rate_op": 10.5,
            "summary": "為替差益と北米の好調により増益"
        }}
        """

        print("  Sending to Gemini...")
        response = model.generate_content([sample_file, prompt])
        
        # Extract JSON
        text = response.text
        # Remove definition block ```json ... ```
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text: # Just code block
            text = text.split("```")[1].split("```")[0]
            
        data = json.loads(text.strip())
        return data

    except Exception as e:
        print(f"  Gemini Analysis Error: {e}")
        return None

def process_revisions():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Select unanalyzed revisions that have a source URL (PDF)
    # Limit to 5 per run to respect Rate Limits (Free tier: 15 RPM, 1500 RPD)
    # Or just run slowly.
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
                # Mark as analyzed (but failed) to skip next time? 
                # Or keep 0 to retry? Let's Mark as analyzed with ERROR summary to avoid loop
                c.execute("UPDATE revisions SET ai_analyzed = 1, ai_summary = 'PDF Download Failed' WHERE id = ?", (rev_id,))
                conn.commit()
                continue
                
            # Save to temp file
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(res.content)
                tmp_path = tmp.name
            
            # Analyze
            result = analyze_revision_pdf(tmp_path, title)
            
            # Cleanup temp file
            os.remove(tmp_path)
            
            if result:
                is_upward = result.get('is_upward') # bool or None
                rate = result.get('revision_rate_op', 0.0)
                summary = result.get('summary', '解析不可')
                
                print(f"  Result: Up={is_upward}, Rate={rate}%, Sum={summary}")
                
                # Update DB
                # Convert python bool to sqlite integer (1/0)
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
                
            else:
                print("  Analysis returned No Data.")
                c.execute("UPDATE revisions SET ai_analyzed = 1, ai_summary = 'Analysis Failed' WHERE id = ?", (rev_id,))
                conn.commit()
                
            # Sleep to respect rate limits (Gemini Free: 2 RPM? No 15 RPM. 4 sec delay is safe)
            time.sleep(5)
            
        except Exception as e:
            print(f"  Error processing row: {e}")
            
    conn.close()

if __name__ == "__main__":
    process_revisions()
