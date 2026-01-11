import requests
from bs4 import BeautifulSoup

def debug_page():
    # Target a normal weekday where earnings usually happen
    url = "https://kabutan.jp/news/?date=20250114&category=3"
    print(f"Fetching {url}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    res = requests.get(url, headers=headers)
    print(f"Status: {res.status_code}")
    
    soup = BeautifulSoup(res.text, 'html.parser')

    print("\n--- Inspecting Links ---")
    links = soup.find_all('a')
    count = 0
    for link in links:
        text = link.get_text().strip()
        # Print if it contains digits (like ticker) or "決算"
        if '決算' in text or any(char.isdigit() for char in text):
            print(f"Link Text: '{text}'  |  Href: {link.get('href')}")
            count += 1
            if count > 50: break # Don't flood
            
    print("\n--- Testing Regex on sample ---")
    import re
    # Test on a hypothetical string if real ones aren't showing
    test_str = "トヨタ <7203> [東証Ｐ] 決算"
    match = re.search(r'(.+?)\s*<(\d{4})>', test_str)
    print(f"Test '{test_str}': {match.groups() if match else 'No match'}")

if __name__ == "__main__":
    debug_page()
