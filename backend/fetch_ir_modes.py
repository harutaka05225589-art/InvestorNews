import requests
from bs4 import BeautifulSoup
import re
import datetime
import time

def get_available_dates(months_ahead=3):
    """
    Crawls Kabutan Monthly Calendar (?mode=5_3) to find valid daily links.
    Returns a set of 'YYYYMMDD' strings.
    """
    valid_dates = set()
    base_url = "https://kabutan.jp/warning/?mode=5_3"
    
    # We want to check current month + next few months
    # Kabutan usually shows links for current month, and possibly next.
    # We need to find the "Next Month" link.
    
    current_url = base_url
    visited_urls = set()
    
    headers = {
        'User-Agent': 'Mozilla/5.0'
    }

    print("Scanning calendar pages for valid links...")
    
    for _ in range(months_ahead + 1):
        if current_url in visited_urls:
            break
        visited_urls.add(current_url)
        
        print(f"  Crawling: {current_url}")
        try:
            res = requests.get(current_url, headers=headers)
            soup = BeautifulSoup(res.text, 'html.parser')
            
            # Find all links to daily schedule
            # They look like: /warning/?mode=5_1&date=20260113 or just ?mode=5_1&date=...
            links = soup.find_all('a', href=re.compile(r'mode=5_1.*date=\d{8}'))
            for l in links:
                href = l.get('href')
                match = re.search(r'date=(\d{8})', href)
                if match:
                    d = match.group(1)
                    valid_dates.add(d)
            
            # Find "Next Month" link
            # Usually labeled "翌月" or "Next"
            # Or look for ?mode=5_3&date=YYYYMM
            # The structure is usually simple navigation.
            next_link = soup.find('a', string=re.compile('翌月'))
            if not next_link:
                # Fallback: look for generic forward arrow or similar class
                # Or just construct the URL manually if we know the current month
                # But manual construction is risky if site logic differs.
                # Let's search for mode=5_3&date=... that is greater than current?
                pass

            if next_link:
                next_href = next_link.get('href')
                if next_href.startswith('?'):
                    current_url = "https://kabutan.jp/warning/" + next_href
                else:
                    current_url = "https://kabutan.jp" + next_href
            else:
                # Manual guess for next month?
                print("    > Next month link not found via text. Attempting manual URL construction.")
                # We need to look at what month this page was.
                # Usually there's a header "2026年 1月"
                header = soup.find('h1') or soup.find('h2') or soup.find('div', class_='tit')
                # Try to parse current month from links we found?
                if valid_dates:
                    # Take a sample date
                    sample = sorted(list(valid_dates))[-1] # formatted YYYYMMDD
                    dt = datetime.datetime.strptime(sample, '%Y%m%d')
                    # Add 1 month
                    if dt.month == 12:
                        next_dt = dt.replace(year=dt.year+1, month=1, day=1)
                    else:
                        next_dt = dt.replace(month=dt.month+1, day=1)
                    next_ym = next_dt.strftime('%Y%m')
                    current_url = f"https://kabutan.jp/warning/?mode=5_3&date={next_ym}"
                else:
                    break
            
            time.sleep(1)

        except Exception as e:
            print(f"Error crawling {current_url}: {e}")
            break
            
    print(f"Found {len(valid_dates)} unique valid dates.")
    return sorted(list(valid_dates))

if __name__ == "__main__":
    dates = get_available_dates(months_ahead=3)
    print("Dates:", dates)
