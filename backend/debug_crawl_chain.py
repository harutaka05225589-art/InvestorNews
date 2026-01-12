import requests
from bs4 import BeautifulSoup
import re
import time
from urllib.parse import urljoin

def crawl_chain(days=5):
    # Start at warnings top page or today's schedule
    # Kabutan uses ?mode=5_1 for Daily Schedule
    current_url = "https://kabutan.jp/warning/?mode=5_1"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"Starting Chain Crawl for {days} steps...")
    
    for i in range(days):
        print(f"\nStep {i+1}: Fetching {current_url}")
        try:
            res = requests.get(current_url, headers=headers, timeout=10)
            soup = BeautifulSoup(res.text, 'html.parser')
            
            # Print Page Title/Date
            title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
            h1 = soup.find('h1').get_text().strip() if soup.find('h1') else "No H1"
            print(f"  Title: {title[:30]}... | H1: {h1}")
            
            # Find "Next Day" link
            # Look for 翌日 or > arrow
            next_link = soup.find('a', string=re.compile(r'翌日'))
            if not next_link:
                # Try finding link with text containing ">" or similar if text matches failed
                # Or specific class
                print("  '翌日' text link not found. Searching for date links...")
                
                # Debug: Print all links that look like navigation
                nav_links = soup.find_all('a', href=True)
                candidates = []
                for l in nav_links:
                    if 'mode=5_1' in l['href'] and 'date=' in l['href']:
                        candidates.append(l['href'])
                
                if candidates:
                    # Usually the last one or one with later date is next?
                    # Let's just print them to see logic
                    print(f"  Found {len(candidates)} date links: {candidates[:3]} ... {candidates[-3:]}")
                    
                    # Heuristic: If we are at 20260113, find 20260114
                    # Extract current date from URL or H1
                    # This is just a debug script, so let's stop if explicit link missing.
                else:
                    print("  No date navigation links found.")
                break
                
            href = next_link.get('href')
            print(f"  Found Next Link: {href}")
            
            # Construct absolute URL
            current_url = urljoin("https://kabutan.jp", href)
            time.sleep(1)
            
        except Exception as e:
            print(f"  Error: {e}")
            break

if __name__ == "__main__":
    crawl_chain(5)
