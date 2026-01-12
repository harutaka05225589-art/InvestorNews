import requests
from bs4 import BeautifulSoup
import re

def check_irbank():
    url = "https://irbank.net/ir_schedule"
    
    print(f"\nChecking IR Bank: {url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding
        soup = BeautifulSoup(res.text, 'html.parser')
        
        title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
        print(f"Title: {title}")
        
        # 1. Print all date links to see navigation pattern
        print("--- Date Links ---")
        links = soup.find_all('a', href=True)
        count = 0
        for l in links:
            href = l.get('href')
            text = l.get_text().strip()
            # Likely patterns: /ir_schedule/YYYYMMDD or ?d=...
            if "ir_schedule" in href or re.search(r'\d{8}', href):
                print(f"Link: [{text}] -> {href}")
                count += 1
                if count > 10: break
        
        # 2. Try to access specific date (Toyota: Feb 6, 2026)
        # Search results hint at https://irbank.net/ir_schedule (maybe list all?)
        # Let's try guessing the URL pattern based on index results.
        # If the top page is just a list, we are good.
        
        body_text = soup.get_text()
        if "7203" in body_text or "トヨタ" in body_text:
            print("SUCCESS: Found Toyota/7203 on top page!")
        else:
            print("Toyota not found on top page. Trying guessed date URL...")
            
            # Guess 1: /ir_schedule/20260206
            guess_url = "https://irbank.net/ir_schedule/20260206"
            print(f"Testing: {guess_url}")
            r2 = requests.get(guess_url, headers=headers)
            if r2.status_code == 200:
                print("  Status 200")
                if "7203" in r2.text or "トヨタ" in r2.text:
                    print("  SUCCESS: Found Toyota in guessed URL.")
                else:
                    print("  Toyota not found in guessed URL.")
            else:
                print(f"  Status {r2.status_code}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_irbank()
