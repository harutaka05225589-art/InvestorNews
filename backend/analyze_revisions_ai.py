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
    # Define Prompt
    prompt = f"""
    あなたの任務は、添付のPDF資料（企業の適時開示情報：{title}）から「業績予想」または「配当予想」の数値を抽出し、JSON形式で出力することです。

    【重要ルール 判断基準】
    1. is_upward: 「投資家にとってポジティブな修正」か？
       - **営業利益(Operating Profit)が前回予想より増額されている場合は true（最優先）。**
       - **営業利益の記載がなく、配当が増額（増配）されている場合も true。**
       - **営業利益も配当も変更なし、または減額/減配の場合は false。**
       - 黒字転換は true。赤字転落・赤字拡大は false。
       
    2. revision_rate_op: 営業利益の修正率（%）。
       - 営業利益の記載がない場合やゼロの場合は 0.0 とする。
       
    3. forecast_data: 業績予想の数値を抽出。
       - "previous": 前回予想, "revised": 今回修正予想
       - "sales": 売上高, "op": 営業利益, "ordinary": 経常利益, "net": 純利益
    
    4. dividend: 配当情報の抽出。
       - "annual_forecast": 修正後の年間配当予想額。
       - "is_hike": 増配なら true。
       - "rights_month": 権利確定月。
       - "payment_month": 支払開始月。
    
    5. quarter: 対象期間

    Output Format (JSON only):
    {{
        "is_upward": true,
        "revision_rate_op": 0.0,
    5. summary: 
       - 「なぜ修正/増配になったのか」の理由を明確に記載してください。
       - 為替の影響、価格転嫁の進捗、販売数量の増減など、具体的な要因を含めてください。
       - 文字数は80〜100文字程度で、投資家が判断材料にできる内容にしてください。
       - 「～ため。」「～ことが寄与。」のように体言止めや簡潔な文末にしてください。

    Output Format (JSON only):
    {{
        "is_upward": true,
        "revision_rate_op": 0.0,
        "summary": "海外売上高が想定を上回り、円安効果も寄与したため。価格改定の浸透により原材料高を吸収し、営業利益は過去最高を更新する見込み。",
        "quarter": "通期",
        "dividend": {{ ... }},
        "forecast_data": null
    }}
    """

    # Retry logic for 429 errors
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Upload file
            print(f"  Uploading PDF to Gemini (Attempt {attempt+1}/{max_retries})...")
            sample_file = genai.upload_file(path=pdf_path, display_name="Revision PDF")
            
            # Wait for processing
            while sample_file.state.name == "PROCESSING":
                time.sleep(2)

            # Run Inference
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content([prompt, sample_file])
            
            # Extract JSON
            text = response.text
            print(f"  [DEBUG] Raw Response: {text[:500]}...")
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
                
            data = json.loads(text.strip())
            return data

        except Exception as e:
            if "429" in str(e):
                wait_time = 30 * (2 ** attempt)  # 30s, 60s, 120s
                print(f"  [WARNING] Rate Limit (429) hit. Sleeping {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"  [ERROR] Gemini API Error: {e}")
                return None
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

            # Race Condition Check: Ensure it hasn't been analyzed by another process since the list was fetched
            current_status = c.execute("SELECT ai_analyzed FROM revisions WHERE id = ?", (rev_id,)).fetchone()
            if current_status and current_status['ai_analyzed'] != 0:
                print(f"  [SKIP] Already analyzed by another process (Status: {current_status['ai_analyzed']})")
                continue
            
            # Skip "Status reports" (Progress updates) to save quota/time
            if "取得状況" in title:
                print("  Skipping status report (noise)...")
                # Mark as analyzed (neutral) so it doesn't loop
                c.execute("UPDATE revisions SET ai_analyzed = 1, ai_summary = 'Stat Report', is_upward = 0 WHERE id = ?", (rev_id,))
                conn.commit()
                continue
            
            # User Request: Analyze ALL captured PDFs (including Financial Results)
            # The previous filter for "Earnings/Dividend only" is removed.
            # We strictly rely on the AI's output to determine if it's relevant.
            
            # (Deleted) is_target check block to allow full analysis.

            try:
                # Download PDF
                if not url or not url.startswith('http'):
                    print(f"  [SKIP] Invalid URL: {url}")
                    result = None
                    # Mark as failed immediately to avoid loop
                    c.execute("UPDATE revisions SET ai_analyzed = 2, ai_summary = 'Invalid URL' WHERE id = ?", (rev_id,))
                    conn.commit()
                    continue

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
                import traceback
                traceback.print_exc()
                result = None

            if result:
                is_upward = result.get('is_upward') 
                rate = result.get('revision_rate_op', 0.0)
                summary = result.get('summary', '解析不可')
                quarter = result.get('quarter', None) 
                
                # Dividend Extraction
                div_data = result.get('dividend') or {}
                div_forecast = div_data.get('annual_forecast', None)
                is_div_hike = 1 if div_data.get('is_hike') else 0
                rights_month = div_data.get('rights_month', None)
                payment_month = div_data.get('payment_month', None)

                forecast_data = result.get('forecast_data', None)
                forecast_data_json = json.dumps(forecast_data, ensure_ascii=False) if forecast_data else None

                print(f"  Result: Up={is_upward}, Rate={rate}%, Div={div_forecast} (Hike={is_div_hike}, Rights={rights_month})")
                
                is_up_int = 1 if is_upward else 0 if is_upward is False else None
                
                # Update DB including quarter and dividend
                c.execute("""
                    UPDATE revisions 
                    SET is_upward = ?, 
                        revision_rate_op = ?,
                        ai_summary = ?,
                        forecast_data = ?,
                        quarter = ?,
                        dividend_forecast_annual = ?,
                        is_dividend_hike = ?,
                        dividend_rights_month = ?,
                        dividend_payment_month = ?,
                        ai_analyzed = 1
                    WHERE id = ?
                """, (is_up_int, rate, summary, forecast_data_json, quarter, div_forecast, is_div_hike, rights_month, payment_month, rev_id))
                conn.commit()
                print("  Saved to DB.")

                # Post to X
                # Only post if upward AND revision rate >= 5%
                if is_upward and rate >= 5.0:
                    try:
                        from send_x import post_to_x
                        
                        # Generate OGP Image URL
                        # api/og?title=...&subtitle=...&type=alert
                        # We use the official domain for generation
                        og_title = f"{row['company_name']} 上方修正"
                        og_subtitle = summary
                        # Encode params safely
                        og_url = f"https://rich-investor-news.com/api/og?title={requests.utils.quote(og_title)}&subtitle={requests.utils.quote(og_subtitle)}&type=alert"
                        
                        # Detail URL
                        detail_url = f"https://rich-investor-news.com/revisions/{rev_id}"
                        
                        x_msg = f"📈 【AI速報: 上方修正判定】\n{ticker} {row['company_name']}\n\n💡 理由: {summary}\n\n👇 詳細・PDF\n{detail_url}\n\n#日本株 #決算速報 #上方修正 #増配 #高配当株"
                        
                        # Download OGP Image to attach (Fix for missing cards)
                        media_path = None
                        try:
                            print(f"  Downloading OGP image from: {og_url}")
                            r_img = requests.get(og_url, timeout=10)
                            if r_img.status_code == 200:
                                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tf:
                                    tf.write(r_img.content)
                                    media_path = tf.name
                            else:
                                print(f"  [WARNING] Failed to download OGP image: {r_img.status_code}")
                        except Exception as e:
                            print(f"  [WARNING] OGP download error: {e}")

                        # Date Check: Only Tweet if Revision Date is TODAY
                        # (Prevents spamming X when backfilling old data)
                        import datetime
                        today_str = datetime.date.today().strftime('%Y-%m-%d')
                        rev_date = row['revision_date'] # String YYYY-MM-DD
                        
                        if rev_date == today_str:
                            tweet_id = post_to_x(x_msg, media_path=media_path)
                        else:
                            tweet_id = None
                            print(f"  -> X Post SKIPPED (Old Date: {rev_date}, Today: {today_str})")

                        # Cleanup temp file
                        if media_path and os.path.exists(media_path):
                            os.remove(media_path)

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
            conn.close()
            exit(1)

        print(f"  Error processing row: {e}")
        try:
            c.execute("UPDATE revisions SET ai_analyzed = 2, ai_summary = 'Processing Error' WHERE id = ?", (rev_id,))
            conn.commit()
        except:
            pass
            
    conn.close()

if __name__ == "__main__":
    process_revisions()
