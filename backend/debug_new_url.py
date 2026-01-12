import requests
from bs4 import BeautifulSoup
import re

def check(date_param):
    # Try different formats? Search said 2026/01/13
    url = f"https://kabutan.jp/stock/finance?code=&date={date_param}"
    print(f"\nChecking {url}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {res.status_code}")
        print(f"Effective URL: {res.url}")
        
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Check H1 or Title
        title = soup.find('title')
        if title: print(f"Title: {title.get_text().strip()}")
        
        # Check for ANY table
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables.")
        
        # Check for date in content
        body_text = soup.get_text()[:1000]
        if date_param in body_text or date_param.replace('/', '年') in body_text:
            print("Requested date found in content.")
        else:
            print("Requested date NOT clearly found in content.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check("20260114")
    check("2026-01-14")
    check("2026/01/14")
