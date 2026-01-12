import requests
from bs4 import BeautifulSoup
import re

def test_yahoo(date_str="20260206"):
    # Format: YYYYMMDD or YYYY-MM-DD?
    # Yahoo usually uses ?date=YYYYMMDD
    url = f"https://finance.yahoo.co.jp/schedule/earnings?date={date_str}"
    print(f"Testing Yahoo URL: {url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0'
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {res.status_code}")
        
        soup = BeautifulSoup(res.text, 'html.parser')
        title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
        print(f"Title: {title}")
        
        # Look for table data
        # Yahoo often uses a specific class for the table
        # Search for Toyota (7203) if testing Feb 6, 2026
        body_text = soup.get_text()
        if "7203" in body_text or "トヨタ" in body_text:
             print("SUCCESS: Found Toyota/7203 in text.")
        else:
             print("Toyota not found in text.")

        # Check for ANY ticker
        tickers = re.findall(r'\b\d{4}\b', body_text)
        print(f"Possible tickers found: {len(tickers)} (Sample: {tickers[:5]})")
        
        # Check if table exists
        tables = soup.find_all('table')
        print(f"Tables found: {len(tables)}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test a date known to have earnings (Toyota: Feb 6, 2026)
    # Check YYYYMMDD format
    test_yahoo("20260206")
    # Check YYYY-MM-DD format
    # test_yahoo("2026-02-06")
