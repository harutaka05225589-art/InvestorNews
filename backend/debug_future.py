import requests
from bs4 import BeautifulSoup
import re

def check(date_str):
    url = f"https://kabutan.jp/warning/?mode=5_1&date={date_str}"
    print(f"\n--- Checking {date_str} ---")
    print(f"URL: {url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    res = requests.get(url, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Effective URL: {res.url}") # Check for redirect
    
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Check H1
    h1 = soup.find('h1')
    if h1: print(f"H1: {h1.get_text().strip()}")
    
    # Check Header Date inside main_body
    main = soup.find('div', id='main_body')
    if main:
        h = main.find('h1') or main.find('h2')
        if h: print(f"Main Header: {h.get_text().strip()}")
        
    # Check Table
    table = soup.find('table', class_='tablesorter')
    if table:
        rows = table.find_all('tr')
        print(f"Table Rows: {len(rows)}")
        # Print first valid row text
        for r in rows[:5]:
            print(f"Row: {r.get_text().strip()[:50]}...")
    else:
        print("No 'tablesorter' table found.")
        # Check ANY table
        tables = soup.find_all('table')
        print(f"Total tables: {len(tables)}")

if __name__ == "__main__":
    # Check Tomorrow (Jan 14) - Should exist?
    check("20260114")
    # Check Next Month (Feb 1)
    check("20260201")
