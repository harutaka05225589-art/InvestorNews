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
        あなたの任務は、添付のPDF資料（企業の適時開示情報：{title}）から「業績予想」または「配当予想」の数値を抽出し、JSON形式で出力することです。
        
        【重要ルール 判断基準】
        1. is_upward: 「投資家にとってポジティブな修正」か？
           - **営業利益(Operating Profit)が前回予想より増額されている場合は true。**
           - **営業利益の記載がなく、配当が増額（増配）されている場合も true。**
           - **営業利益も配当も変更なし、または減額/減配の場合は false。**
           - 黒字転換は true。赤字転落・赤字拡大は false。
           
        2. revision_rate_op: 営業利益の修正率（%）。
           - 営業利益の記載がない場合やゼロの場合は 0.0 とする。
           
        3. forecast_data: 業績予想の数値を抽出（修正がない場合は null でも可だが、あれば抽出）。
           - "previous": 前回予想, "revised": 今回修正予想
           - "sales": 売上高, "op": 営業利益, "ordinary": 経常利益, "net": 純利益
        
        4. dividend: **配当情報の抽出（最重要）**。
           - 配当予想の修正、剰余金の処分、配当決定などのニュースから、**「年間配当等の総額（１株当たり）」**を抽出してください。
           - "annual_forecast": 修正後の年間配当予想額（円単位、数値）。合計欄がない場合は四半期ごとの合算値を入れる。不明な場合は null。
           - "is_hike": 前回予想または前期実績と比較して「増配」である場合は true。減配や維持は false。
           - "rights_month": 配当の権利確定月 (例: 3, 9)。期末配当の月を優先。
           - "payment_month": 配当の支払開始月 (例: 6, 12)。記載がなければ null。
        
        5. quarter: 対象期間（例: "通期", "第2四半期"）

        Output Format (JSON only):
        {{
            "is_upward": true,
            "revision_rate_op": 0.0,
            "summary": "業績修正なしかつ増配を発表",
            "quarter": "通期",
            "dividend": {{
                "annual_forecast": 120.0,
                "is_hike": true,
                "rights_month": 3,
                "payment_month": 6
            }},
            "forecast_data": null
        }}
        """

        # ... (Model selection logic remains) ...
        
        # Extract JSON
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
            
        data = json.loads(text.strip())
        return data

    except Exception as e:
        # Error handling ...
        return None
def process_revisions():
    print("Starting AI Analysis...")
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    try:
        # Fetch unanalyzed
        rows = c.execute("SELECT * FROM revisions WHERE ai_analyzed = 0 ORDER BY id DESC").fetchall()
        print(f"Found {len(rows)} unanalyzed items")

        for row in rows:
            rev_id = row['id']
            ticker = row['ticker']
            title = row['title']
            url = row['source_url']
            company_name = row['company_name']

            print(f"Analyzing {ticker} {company_name}: {title}")
            
            if not url:
                print("  No URL, skipping")
                c.execute("UPDATE revisions SET ai_analyzed = 2, ai_summary = 'No URL' WHERE id = ?", (rev_id,))
                conn.commit()
                continue

            try:
                # Download PDF
                # Use a specific user agent to avoid 403
                headers = {'User-Agent': 'Mozilla/5.0'}
                r = requests.get(url, headers=headers, timeout=15)
                
                pdf_path = None
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
                    f.write(r.content)
                    pdf_path = f.name
                
                result = analyze_revision_pdf(pdf_path, title)
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
            
            except Exception as e:
                print(f"  Error downloading/analyzing PDF: {e}")
                result = None


