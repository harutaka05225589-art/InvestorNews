import os
import sqlite3
import datetime
import yfinance as yf
import pandas as pd
from send_x import post_to_x

# Config
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def get_weekly_revisions():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get revisions from last 7 days
    # SQLite 'date' function might vary depending on schema, but assuming standard YYYY-MM-DD string
    seven_days_ago = (datetime.date.today() - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
    
    query = """
        SELECT DISTINCT ticker, company_name 
        FROM revisions 
        WHERE revision_date >= ?
    """
    rows = c.execute(query, (seven_days_ago,)).fetchall()
    conn.close()
    return rows # list of (ticker, name)

def get_stock_performance(ticker_list):
    if not ticker_list:
        return {}
        
    # Format for yfinance: "7203.T"
    yf_tickers = [f"{t}.T" for t in ticker_list]
    
    if not yf_tickers:
        return {}
        
    # Download data for last 1 week (5 days is safer for business days)
    # Using period="5d" is simple relative to "now"
    try:
        # download returns a DataFrame with MultiIndex columns if multiple tickers
        data = yf.download(yf_tickers, period="5d", progress=False)['Close']
    except Exception as e:
        print(f"yfinance error: {e}")
        return {}

    performance = {}
    
    # Check if data is empty
    if data.empty:
        return {}
        
    # For each ticker, calculate change
    # If single ticker, 'data' is Series. If multiple, it's DataFrame.
    
    if isinstance(data, pd.Series):
        # Single ticker case
        # ticker_list has only 1 item
        t_code = ticker_list[0]
        first = data.iloc[0]
        last = data.iloc[-1]
        if first > 0:
            change_pct = ((last - first) / first) * 100
            performance[t_code] = change_pct
    else:
        # DataFrame case
        for t_code in ticker_list:
            yf_code = f"{t_code}.T"
            if yf_code in data.columns:
                series = data[yf_code].dropna()
                if len(series) >= 2:
                    first = series.iloc[0]
                    last = series.iloc[-1]
                    if first > 0:
                        change_pct = ((last - first) / first) * 100
                        performance[t_code] = change_pct

    return performance

def send_ranking_tweet():
    revisions = get_weekly_revisions() # list of (ticker, name)
    
    if not revisions:
        print("No revisions found this week. Skipping.")
        return

    print(f"Found {len(revisions)} revisions this week. Fetching prices...")
    
    ticker_map = {r[0]: r[1] for r in revisions} # ticker -> name
    unique_tickers = list(ticker_map.keys())
    
    perf_map = get_stock_performance(unique_tickers)
    
    if not perf_map:
        print("Could not fetch price data.")
        return

    # Sort by performance DESC
    sorted_perf = sorted(perf_map.items(), key=lambda x: x[1], reverse=True)
    
    # Take Top 20 for Website, Top 5 for Tweet
    top_20 = sorted_perf[:20]
    top_5 = sorted_perf[:5]
    
    if not top_5:
        print("No valid performance data.")
        return

    # --- Save to JSON for Frontend ---
    import json
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'public', 'data', 'weekly_ranking.json')
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    
    ranking_data = []
    for rank, (ticker, pct) in enumerate(top_20, 1):
        ranking_data.append({
            "rank": rank,
            "ticker": ticker,
            "name": ticker_map.get(ticker, "Unknown"),
            "change_pct": round(pct, 1)
        })
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump({"updated_at": datetime.datetime.now().strftime('%Y-%m-%d %H:%M'), "ranking": ranking_data}, f, ensure_ascii=False, indent=2)
    
    print(f"Saved ranking data to {json_path}")

    # --- Build Tweet ---
    # 📊 今週の上方修正ランキング TOP5
    msg = "📊 今週の決算・上方修正 爆上げランキング TOP5\n\n"
    
    for i, (ticker, pct) in enumerate(top_5, 1):
        name = ticker_map.get(ticker, "Unknown")
        # Format: 1. トヨタ (+15.2%)
        sign = "+" if pct > 0 else ""
        msg += f"{i}. {name} ({sign}{pct:.1f}%)\n"
    
    msg += "\n▶ 全件ランキング\nhttps://rich-investor-news.com/revisions/ranking\n#日本株 #決算速報 #株式投資 #投資家さんと繋がりたい"
    
    print("--- Tweet Content ---")
    print(msg)
    print("---------------------")
    
    # Post
    try:
        post_to_x(msg)
        print("✅ Ranking tweet sent!")
    except Exception as e:
        print(f"❌ Failed to send ranking tweet: {e}")

if __name__ == "__main__":
    send_ranking_tweet()
