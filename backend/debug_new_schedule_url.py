import requests
from bs4 import BeautifulSoup
import re

def check_url(url):
    print(f"\nChecking: {url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {res.status_code}")
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Title/H1
        print(f"Title: {soup.title.string.strip()}")
        h1 = soup.find('h1')
        if h1: print(f"H1: {h1.get_text().strip()}")
        
        # Look for future dates
        body = soup.get_text()
        # Simple scan for dates like "1月16日"
        dates = re.findall(r'\d{1,2}月\d{1,2}日', body)
        print(f"Dates found in text: {dates[:10]} ...")
        
        # Look for links that might be date navigations
        links = soup.find_all('a')
        date_links = [l.get('href') for l in links if 'date=' in str(l.get('href'))]
        print(f"Links with 'date=' found: {len(date_links)}")
        if date_links:
            print(f"Sample date links: {date_links[:3]}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_url("https://kabutan.jp/disclosures/schedule")
    # Also check if it accepts params
    check_url("https://kabutan.jp/disclosures/schedule?date=20260120")
