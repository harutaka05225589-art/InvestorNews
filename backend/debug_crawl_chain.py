import requests
from bs4 import BeautifulSoup
import re
import time
from urllib.parse import urljoin

def crawl_chain(days=5):
    # Start from a known past business day (Friday Jan 9, 2026) to ensure nav links exist
    current_url = "https://kabutan.jp/warning/?mode=5_1&date=20260109"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"Starting Chain Crawl for {days} steps from {current_url}...")
    
    seen_urls = set()
    
    for i in range(days):
        if current_url in seen_urls:
            print("  Loop detected. Stopping.")
            break
        seen_urls.add(current_url)
        
        print(f"\nStep {i+1}: Fetching {current_url}")
        try:
            res = requests.get(current_url, headers=headers, timeout=10)
            soup = BeautifulSoup(res.text, 'html.parser')
            
            # Print Page Title/Date
            h1 = soup.find('h1').get_text().strip() if soup.find('h1') else "No H1"
            print(f"  H1: {h1}")
            
            # Find "Next Day" link
            # Search for text '翌日' OR 'Next' OR check specific navigation classes
            next_link = soup.find('a', string=re.compile(r'翌日'))
            
            if not next_link:
                print("  '翌日' text link not found. Inspecting all 'warning' links...")
                # Fallback: Look for links to warning mode=5_1 with date > current
                # current date from URL
                curr_match = re.search(r'date=(\d{8})', current_url)
                if curr_match:
                    curr_date = int(curr_match.group(1))
                    
                    all_a = soup.find_all('a', href=True)
                    candidates = []
                    for a in all_a:
                        href = a['href']
                        if 'mode=5_1' in href and 'date=' in href:
                            d_match = re.search(r'date=(\d{8})', href)
                            if d_match:
                                d_val = int(d_match.group(1))
                                if d_val > curr_date:
                                    candidates.append((d_val, href))
                    
                    if candidates:
                        # Sort by date and pick the closest next one
                        candidates.sort()
                        print(f"  Found {len(candidates)} future link candidates. Picking closest: {candidates[0][0]}")
                        next_link = soup.new_tag('a', href=candidates[0][1]) # Mock tag
                    else:
                        print("  No future date links found.")
            
            if next_link:
                href = next_link.get('href')
                print(f"  Found Next Link: {href}")
                current_url = urljoin("https://kabutan.jp", href)
            else:
                print("  Dead end.")
                break
                
            time.sleep(1)
            
        except Exception as e:
            print(f"  Error: {e}")
            break

if __name__ == "__main__":
    crawl_chain(5)
    # End test
