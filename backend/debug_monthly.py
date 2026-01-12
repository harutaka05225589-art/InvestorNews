import requests
from bs4 import BeautifulSoup
import re

def check_monthly():
    url = "https://kabutan.jp/warning/?mode=5_3"
    print(f"Fetching {url}...")
    headers = {
        'User-Agent': 'Mozilla/5.0'
    }
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # 1. Look for a calendar table
    # usually standard calendar table with links on days
    calendar = soup.find('table', class_='in_calendar') # Guessing class name
    if not calendar:
        calendar = soup.find('table', class_='stock_table') # Another guess
    if not calendar:
        # Just find ALL tables
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables.")
        calendar = tables[0] if tables else None

    if calendar:
        print("Scaning table for links...")
        links = calendar.find_all('a')
        valid_dates = []
        for l in links:
            href = l.get('href')
            txt = l.get_text().strip()
            # print(f"Link: {txt} -> {href}")
            
            # Check for ?mode=5_1&date=YYYYMMDD
            match = re.search(r'date=(\d{8})', href)
            if match:
                valid_dates.append(match.group(1))
        
        print(f"Found {len(valid_dates)} valid date links in monthly view.")
        print(f"Sample: {valid_dates[:10]}")
    
    # 2. Check for "Next Month" link
    next_link = soup.find('a', string=re.compile(r'翌月|来月|Next'))
    if next_link:
        print(f"Next Month Link: {next_link.get_text()} -> {next_link.get('href')}")
    else:
        # Search by class or just all links again for "mode=5_3"
        print("Searching for next month pagination...")
        pager_links = soup.find_all('a', href=re.compile(r'mode=5_3'))
        for l in pager_links:
             print(f"Pager: {l.get_text()} -> {l.get('href')}")

if __name__ == "__main__":
    check_monthly()
