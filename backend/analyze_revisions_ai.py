import os
import time
import traceback
import requests
import tempfile
import json
import sqlite3
import datetime
from google import genai
from database import get_db_connection
from daily_limits import can_call_api, increment_api_calls, remaining_api_calls, can_tweet, increment_tweets
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

def analyze_revision_pdf(pdf_path, title):
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
       - "annual_previous": 前回予想の年間配当額（ない場合は0またはnull）。
       - "is_hike": 増配なら true。
       - "rights_month": 権利確定月。
       - "payment_month": 支払開始月。
    
    5. quarter: 対象期間

    Output Format (JSON only):
    {{
    5. summary: 
       - 「なぜ修正/増配になったのか」の理由を明確に記載してください。
       - 為替の影響、価格転嫁の進捗、販売数量の増減など、具体的な要因を含めてください。
       - 文字数は80〜100文字程度で、投資家が判断材料にできる内容にしてください。
       - 「～ため。」「～ことが寄与。」のように体言止めや簡潔な文末にしてください。
    
    6. prospects: 
       - この企業の「将来性や今後の展望・リスク」について、開示資料の定性情報から予測・要約してください。
       - 今後の成長ドライバー（新製品、海外展開、M&Aなど）や、懸念されるリスク（原材料高、競争激化など）を挙げてください。
       - 文字数は150〜200文字程度で、投資家が長期的な投資判断の材料にできる内容にしてください。

    7. category: 修正の種類 (以下のいずれかを選択)
       - "earnings": 業績予想の修正のみ
       - "dividend": 配当予想の修正のみ
       - "both": 業績と配当の両方の修正
       - "buyback": 自社株買い
       - "other": その他

    Output Format (JSON only):
    {{
        "category": "both",
        "is_upward": true,
        "revision_rate_op": 0.0,
        "summary": "海外売上高が想定を上回り、円安効果も寄与したため。価格改定の浸透により原材料高を吸収し、営業利益は過去最高を更新する見込み。",
        "prospects": "北米市場を中心とした堅調な需要拡大に加え、来期にかけては新工場の稼働による生産能力向上とサプライチェーンの最適化が利益率の改善に寄与する見通しです。一方で、中国市場の競争激化や継続的な原材料価格の高止まりが懸念材料として残るものの、高付加価値製品の販売比率を高めることで収益基盤の強化を図っています。",
        "quarter": "通期",
        "dividend": {{ "annual_forecast": 100, "annual_previous": 80, "is_hike": true, "rights_month": 3, "payment_month": 6 }},
        "forecast_data": null
    }}
    """

    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"  Uploading PDF to Gemini (Attempt {attempt+1}/{max_retries})...")
            sample_file = client.files.upload(file=pdf_path, config={'display_name': 'Revision PDF'})
            
            start_wait = time.time()
            while True:
                f_state = client.files.get(name=sample_file.name)
                if f_state.state.name == "PROCESSING":
                    if time.time() - start_wait > 60:
                        raise Exception("PDF processing timed out on Gemini server (60s limit)")
                    time.sleep(2)
                else:
                    break

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[prompt, sample_file]
            )
            
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
                wait_time = 30 * (2 ** attempt)
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

    if not can_call_api():
        print(f"  [LIMIT] Daily API call limit reached ({remaining_api_calls()} remaining). Skipping AI analysis.")
        conn.close()
        return

    cutoff_date = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime('%Y-%m-%d')
    rows = c.execute("""
        SELECT * FROM revisions 
        WHERE revision_date >= ?
          AND (
              ai_analyzed = 0 
              OR (ai_analyzed = 2 AND COALESCE(retry_count, 0) < 3)
          )
        ORDER BY 
            ai_analyzed ASC,
            id DESC
        LIMIT 10
    """, (cutoff_date,)).fetchall()
    
    new_count = sum(1 for r in rows if r['ai_analyzed'] == 0)
    retry_count_total = sum(1 for r in rows if r['ai_analyzed'] == 2)
    print(f"Found {new_count} unanalyzed items, {retry_count_total} items to retry (cutoff: {cutoff_date})")

    api_remaining = remaining_api_calls()
    if len(rows) > api_remaining:
        print(f"  [LIMIT] Capping batch to {api_remaining} items (daily API limit)")
        rows = rows[:api_remaining]

    for row in rows:
      try:
        rev_id = row['id']
        ticker = row['ticker']
        title = row['title']
        url = row['source_url']
        company_name = row['company_name']
        current_retry = row['retry_count'] if 'retry_count' in row.keys() else 0
        current_retry = current_retry or 0

        is_retry = row['ai_analyzed'] == 2
        if is_retry:
            print(f"[RETRY {current_retry+1}/3] Analyzing {ticker} {company_name}: {title}")
        else:
            print(f"Analyzing {ticker} {company_name}: {title}")

        current_status = c.execute("SELECT ai_analyzed FROM revisions WHERE id = ?", (rev_id,)).fetchone()
        if current_status and current_status['ai_analyzed'] == 1:
            print(f"  [SKIP] Already analyzed by another process")
            continue
        
        c.execute("UPDATE revisions SET ai_analyzed = 2, retry_count = COALESCE(retry_count, 0) + 1 WHERE id = ?", (rev_id,))
        conn.commit()
        
        if "取得状況" in title:
            print("  Skipping status report (noise)...")
            c.execute("UPDATE revisions SET ai_analyzed = 1, ai_summary = 'Stat Report', is_upward = 0 WHERE id = ?", (rev_id,))
            conn.commit()
            continue
        
        prev_div_row = c.execute("""
            SELECT dividend_forecast_annual 
            FROM revisions 
            WHERE ticker = ? 
              AND id != ? 
              AND dividend_forecast_annual IS NOT NULL 
              AND ai_analyzed = 1
            ORDER BY revision_date DESC, id DESC 
            LIMIT 1
        """, (ticker, rev_id)).fetchone()
        
        db_prev_div = prev_div_row['dividend_forecast_annual'] if prev_div_row else None
        if db_prev_div is not None:
            print(f"  [DB Comparison] Found previous dividend: {db_prev_div}")

        try:
            if not url or not url.startswith('http'):
                print(f"  [SKIP] Invalid URL: {url}")
                result = None
                c.execute("UPDATE revisions SET ai_analyzed = 2, ai_summary = 'Invalid URL' WHERE id = ?", (rev_id,))
                conn.commit()
                continue

            headers = {'User-Agent': 'Mozilla/5.0'}
            r = requests.get(url, headers=headers, timeout=15)
            
            pdf_path = None
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
                f.write(r.content)
                pdf_path = f.name
            
            increment_api_calls()
            result = analyze_revision_pdf(pdf_path, title)

            if os.path.exists(pdf_path):
                os.remove(pdf_path)
        
        except Exception as e:
            print(f"  Error downloading/analyzing PDF: {e}")
            traceback.print_exc()
            result = None

        if result:
            is_upward = result.get('is_upward') 
            rate = result.get('revision_rate_op', 0.0)
            summary = result.get('summary', '解析不可')
            prospects = result.get('prospects', None)
            quarter = result.get('quarter', None) 
            category = result.get('category', 'earnings')
            
            valid_cats = ['earnings', 'dividend', 'both', 'buyback', 'other']
            if category not in valid_cats:
                if "配当" in title and "修正" in title: category = 'both'
                elif "配当" in title: category = 'dividend'
                else: category = 'earnings'

            div_data = result.get('dividend') or {}
            div_forecast = div_data.get('annual_forecast', None)
            div_previous = div_data.get('annual_previous', None)
            
            final_prev = db_prev_div if db_prev_div is not None else div_previous
            
            is_div_hike = 0
            if div_data.get('is_hike'):
                is_div_hike = 1
            
            calculated_diff = 0
            if div_forecast is not None and final_prev is not None:
                 try:
                     f_curr = float(div_forecast)
                     f_prev = float(final_prev)
                     calculated_diff = f_curr - f_prev
                     
                     if calculated_diff > 0:
                         is_div_hike = 1
                     elif calculated_diff < 0:
                         is_div_hike = -1
                     else:
                         is_div_hike = 0
                 except:
                     pass

            if calculated_diff == 0 and div_forecast is None and div_data.get('is_hike'):
                 is_div_hike = 1

            rights_month = div_data.get('rights_month', None)
            payment_month = div_data.get('payment_month', None)

            if isinstance(rights_month, list): rights_month = rights_month[0] if rights_month else None
            if isinstance(payment_month, list): payment_month = payment_month[0] if payment_month else None

            forecast_data = result.get('forecast_data', None)
            forecast_data_json = json.dumps(forecast_data, ensure_ascii=False) if forecast_data else None

            print(f"  Result: Cat={category}, Up={is_upward}, Rate={rate}%, Div={div_forecast} (Prev={final_prev} [DB: {db_prev_div}])")
            
            is_up_int = 1 if is_upward else 0 if is_upward is False else None
            
            c.execute("""
                UPDATE revisions 
                SET is_upward = ?, 
                    revision_rate_op = ?,
                    ai_summary = ?,
                    ai_prospects = ?,
                    forecast_data = ?,
                    quarter = ?,
                    dividend_forecast_annual = ?,
                    dividend_forecast_previous = ?,
                    is_dividend_hike = ?,
                    dividend_rights_month = ?,
                    dividend_payment_month = ?,
                    category = ?,
                    ai_analyzed = 1
                WHERE id = ?
            """, (is_up_int, rate, summary, prospects, forecast_data_json, quarter, div_forecast, final_prev, is_div_hike, rights_month, payment_month, category, rev_id))
            conn.commit()
            print("  Saved to DB.")
            
            # --- Auto-Sync Master Tables (dividend_history & financial_stats) ---
            try:
                if div_forecast is not None:
                    last_div = c.execute("SELECT id, period, is_forecast FROM dividend_history WHERE ticker = ? ORDER BY period DESC LIMIT 1", (ticker,)).fetchone()
                    if last_div:
                        if last_div['is_forecast'] == 1:
                            c.execute("UPDATE dividend_history SET dividend_amount = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?", (div_forecast, last_div['id']))
                        else:
                            try:
                                year, month = last_div['period'].split('.')
                                next_period = f"{int(year)+1}.{month}"
                                c.execute("INSERT OR REPLACE INTO dividend_history (ticker, period, dividend_amount, is_forecast) VALUES (?, ?, ?, ?)", (ticker, next_period, div_forecast, 1))
                            except: pass

                if forecast_data and forecast_data.get('revised'):
                    revised = forecast_data['revised']
                    sales = revised.get('sales')
                    op = revised.get('op')
                    if sales is not None or op is not None:
                        last_fin = c.execute("SELECT id, period_end, is_forecast FROM financial_stats WHERE ticker = ? AND period_type = 'annual' ORDER BY period_end DESC LIMIT 1", (ticker,)).fetchone()
                        if last_fin:
                            if last_fin['is_forecast'] == 1:
                                c.execute("""
                                    UPDATE financial_stats 
                                    SET sales = ?, operating_profit = ?, ordinary_profit = ?, net_profit = ?
                                    WHERE id = ?
                                """, (sales, op, revised.get('ordinary'), revised.get('net'), last_fin['id']))
                            else:
                                try:
                                    year, month = last_fin['period_end'].split('-')[0:2]
                                    next_period_end = f"{int(year)+1}-{month}"
                                    c.execute("""
                                        INSERT OR REPLACE INTO financial_stats 
                                        (ticker, period_type, period_end, sales, operating_profit, ordinary_profit, net_profit, is_forecast, source)
                                        VALUES (?, 'annual', ?, ?, ?, ?, ?, 1, 'TDnet AI')
                                    """, (ticker, next_period_end, sales, op, revised.get('ordinary'), revised.get('net')))
                                except: pass
                
                conn.commit()
            except Exception as e_sync:
                print(f"  [ERROR] Master DB Sync Failed: {e_sync}")
            
            # (User account / LINE notification system has been removed)
            
            # --- Post to X (Public) ---
            latest = c.execute("SELECT tweeted_at, ai_analyzed FROM revisions WHERE id = ?", (rev_id,)).fetchone()
            if not latest: continue
            
            if latest['tweeted_at']:
                print(f"  -> X Post SKIPPED (Already tweeted at {latest['tweeted_at']})")
            else:
                jst_now = datetime.datetime.utcnow() + datetime.timedelta(hours=9)
                today_str_jst = jst_now.strftime('%Y-%m-%d')
                
                check_query = "SELECT id FROM revisions WHERE ticker = ? AND date(tweeted_at, '+9 hours') = ? LIMIT 1"
                c.execute(check_query, (ticker, today_str_jst))
                existing_tweet = c.fetchone()
                
                if existing_tweet:
                     print(f"  -> X Post SKIPPED (Already tweeted for ticker {ticker} today JST)")
                     should_post = False
                else:
                    should_post = False
                header_text = "📈 【AI速報: 上方修正判定】"
                hashtags = "#日本株 #決算速報 #上方修正 #増配 #高配当株"

                if category == 'buyback':
                    should_post = False
                    print("  -> X Post SKIPPED (Category: Buyback)")
                    header_text = "🚀 【AI速報: 自社株買い判定】"
                else:
                    is_earnings_hike = (is_upward and rate >= 5.0)
                    
                    if is_earnings_hike and is_div_hike:
                        should_post = True
                        header_text = "🚀 【AI速報: 上方修正＆増配】"
                    elif is_div_hike:
                        should_post = True
                        header_text = "💰 【AI速報: 増配判定】"
                    elif is_earnings_hike:
                        should_post = True
                        header_text = "📈 【AI速報: 上方修正判定】"

                should_post = False
                if should_post and not can_tweet():
                    print(f"  -> X Post SKIPPED (Daily tweet limit of 7 reached)")
                    should_post = False

                if should_post:
                    try:
                        from send_x import post_to_x
                        detail_url = f"https://rich-investor-news.com/revisions/{rev_id}"
                        summary_x = summary if len(summary) <= 100 else summary[:98] + "…"
                        x_msg = f"{header_text}\n{ticker} {row['company_name']}\n\n💡 理由: {summary_x}\n\n{hashtags}\n\n👇 詳細・AI要約ページへ\n{detail_url}"

                        today_str = datetime.date.today().strftime('%Y-%m-%d')
                        rev_date = row['revision_date']
                        
                        if rev_date == today_str:
                            tweet_id = post_to_x(x_msg)
                        else:
                            tweet_id = None
                            print(f"  -> X Post SKIPPED (Old Date: {rev_date}, Today: {today_str})")

                        if tweet_id:
                            print(f"  -> Posted to X successfully: {tweet_id}")
                            increment_tweets()
                            c.execute("UPDATE revisions SET tweeted_at = CURRENT_TIMESTAMP WHERE id = ?", (rev_id,))
                            conn.commit()
                        else:
                            print("  -> Failed to post to X (Check logs)")
                    except Exception as e:
                        print(f"  -> Exception posting to X: {e}")
                else:
                    print(f"  -> Skip X post (Verdict: {'Down' if is_upward is False else 'Neutral/Small'}, Cat: {category})")
            
        else:
            print("  Analysis returned No Data.")
            summary = '解析不可'
            is_upward = 0
            category = 'other'
            c.execute("UPDATE revisions SET ai_analyzed = 1, ai_summary = ?, is_upward = ?, category = ? WHERE id = ?", (summary, is_upward, category, rev_id))
            conn.commit()
            
        print("  Sleeping 15s to respect Rate Limits...")
        time.sleep(15)

      except Exception as e:
        if "QUOTA_EXCEEDED" in str(e):
            print("\n!!! CRITICAL: QUOTA EXCEEDED (429) !!!")
            conn.close()
            exit(1)

        print(f"  [ERROR] Processing row {rev_id} ({ticker}): {e}")
        traceback.print_exc()
        try:
            current = c.execute("SELECT ai_analyzed FROM revisions WHERE id = ?", (rev_id,)).fetchone()
            if current and current['ai_analyzed'] != 1:
                c.execute("UPDATE revisions SET ai_analyzed = 2, ai_summary = 'Processing Error' WHERE id = ?", (rev_id,))
                conn.commit()
            else:
                print(f"  [INFO] Analysis already saved successfully, keeping ai_analyzed=1")
        except:
            pass
        continue
            
    conn.close()

if __name__ == "__main__":
    process_revisions()
