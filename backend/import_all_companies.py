import requests
from bs4 import BeautifulSoup
import time
import sqlite3
import re
from database import get_db_connection
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

def fetch_company_info(ticker):
    """
    Fetches company info for a specific ticker.
    Returns dict or None.
    """
    url = f"https://kabutan.jp/stock/?code={ticker}"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    try:
        # random delay to be polite (0.1 - 0.5s)
        # time.sleep(0.1) 
        
        res = requests.get(url, headers=headers, timeout=10)
        
        if res.status_code == 404:
            return None
            
        if res.status_code != 200:
            # print(f"Error {ticker}: {res.status_code}")
            return None
            
        soup = BeautifulSoup(res.content, "html.parser")
        
        # Parse Title
        # Format: トヨタ自動車（トヨタ）【7203】株の基本情報｜株探（かぶたん）
        title = soup.title.string if soup.title else ""
        
        # Regex to extract name
        # ^(.*?)（.*?）【(\d{4})】
        # Or simpler: ^(.*?)【(\d{4})】 if short name missing?
        # Kabutan usually has: Name (Short) [Code]
        
        # Try to find specific element for name
        # <div class="si_i1_1"><h2>...</h2></div>
        
        name = ""
        market = ""
        sector = ""
        
        # Name
        h2 = soup.find("div", class_="si_i1_1")
        if h2 and h2.find("h2"):
             # "4556　カイノス"
             text = h2.find("h2").get_text().strip()
             parts = text.split("　")
             if len(parts) > 1:
                 name = parts[1]
             else:
                 name = text
        
        if not name:
            # Fallback to title
            # Split by 【
            parts = title.split("【")
            if len(parts) > 0:
                name_part = parts[0]
                # Remove （...）if present?
                # Usually: Company (Short)
                name = name_part.strip()
        
        # Market & Sector
        # <span class="market">プライム</span>
        # <span class="industry">医薬品</span> (might be link)
        
        market_elem = soup.find("span", class_="market")
        if market_elem:
            market = market_elem.get_text().strip()
            
        # Sector is often a link in a breadcrumb or specific area
        # <div id="stockinfo_i2"> ... <a href="/themes/?industry=...">医薬品</a>
        stockinfo_i2 = soup.find("div", id="stockinfo_i2")
        if stockinfo_i2:
            links = stockinfo_i2.find_all("a")
            for link in links:
                href = link.get("href", "")
                if "industry=" in href:
                    sector = link.get_text().strip()
                    break
        
        return {
            "ticker": str(ticker),
            "name": name,
            "market": market,
            "sector": sector
        }

    except Exception as e:
        # print(f"Exception {ticker}: {e}")
        return None

def import_all_companies():
    print("Starting brute-force import of companies (1300-9999)...")
    
    # Range of tickers
    # Standard codes are 4 digits.
    # 1300 to 9999.
    tickers = range(1300, 10000)
    
    results = []
    
    # Use ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=20) as executor:
        future_to_ticker = {executor.submit(fetch_company_info, t): t for t in tickers}
        
        # Batch save to DB every 100 or so? 
        # Or just collect all then save (memory is fine for 4000 dicts)
        
        for future in tqdm(as_completed(future_to_ticker), total=len(tickers)):
            res = future.result()
            if res:
                results.append(res)
                
    print(f"Found {len(results)} companies.")
    save_companies(results)

def save_companies(companies):
    if not companies: return
    
    conn = get_db_connection()
    c = conn.cursor()
    
    print(f"Saving {len(companies)} companies to database...")
    count = 0
    for comp in companies:
        try:
            c.execute("""
                INSERT INTO companies (ticker, name, market, sector, created_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(ticker) DO UPDATE SET
                    name=excluded.name,
                    market=excluded.market,
                    sector=excluded.sector
            """, (comp['ticker'], comp['name'], comp['market'], comp['sector']))
            count += 1
        except Exception as e:
            print(f"Error saving {comp['ticker']}: {e}")
            
    conn.commit()
    conn.close()
    print(f"Saved {count} companies.")

if __name__ == "__main__":
    import_all_companies()
