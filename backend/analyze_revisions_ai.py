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

# ... (process_revisions logic update) ...

            if result:
                is_upward = result.get('is_upward') 
                rate = result.get('revision_rate_op', 0.0)
                summary = result.get('summary', '解析不可')
                quarter = result.get('quarter', None) 
                
                # Dividend Extraction
                div_data = result.get('dividend', {})
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
                        og_url = f"https://rich-investor-news.com/api/og?title={requests.utils.quote(og_title)}&subtitle={requests.utils.quote(og_subtitle)}&type=alert"
                        
                        # New Logic: Clickable OGP Card
                        # Post URL to the detail page, which has the OGP meta tags
                        detail_url = f"https://rich-investor-news.com/revisions/{rev_id}"
                        
                        clean_title = title[:30] + "..." if len(title) > 30 else title
                        
                        # Message must NOT have media attached for the card to show up
                        x_msg = f"📈 【AI速報: 上方修正判定】\n{ticker} {row['company_name']}\n\n💡 理由: {summary}\n\n👇 詳細・PDF\n{detail_url}\n\n#株 #決算 #上方修正"
                        
                        # Post without media (pass None)
                        # The URL in text will automatically be cardified by X
                        tweet_id = post_to_x(x_msg, media_path=None)

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
