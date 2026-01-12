import requests
from bs4 import BeautifulSoup
import re

def analyze_page():
    # 1. Inspect Today's Page for Navigation
    url = "https://kabutan.jp/warning/?mode=5_1"
    print(f"Analyze: {url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Dump all links that look like navigation
        print("--- Navigation Links Found ---")
        links = soup.find_all('a', href=True)
        count = 0
        for l in links:
            href = l.get('href')
            text = l.get_text().strip().replace('\n', '')
            
            # Filter relevant links
            if 'mode=5_1' in href or 'date=' in href or '翌日' in text or 'Next' in text:
                print(f"Link: [{text}] -> {href}")
                count += 1
                if count > 20: 
                    print("... (truncated)")
                    break
        
        # 2. Test Specific Future Date (Toyota Earnings: 2026-02-06)
        # Try both URL patterns
        target_date = "20260206"
        urls_to_test = [
            f"https://kabutan.jp/warning/?mode=5_1&date={target_date}",
            f"https://kabutan.jp/stock/finance?code=&date=2026/02/06",
            f"https://minkabu.jp/financial_schedule/decision_date/2026-02-06" # Alternative?
        ]
        
        print("\n--- Testing Specific Future Date (2026-02-06) ---")
        for u in urls_to_test:
            print(f"Checking: {u}")
            try:
                r = requests.get(u, headers=headers, timeout=5)
                print(f"  Status: {r.status_code}")
                if r.status_code == 200:
                    # Check if it's a valid earnings page or generic top
                    s = BeautifulSoup(r.text, 'html.parser')
                    title = s.find('title').get_text().strip()
                    print(f"  Title: {title}")
                    # Look for known ticker 7203 (Toyota)
                    if "7203" in r.text or "トヨタ" in r.text:
                        print("  SUCCESS: Found Toyota (7203) on this page!")
                    else:
                        print("  Toyota not found.")
            except Exception as e:
                print(f"  Error: {e}")

    except Exception as e:
        print(f"Error analyzing main page: {e}")

if __name__ == "__main__":
    analyze_page()
