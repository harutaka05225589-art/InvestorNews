import requests
from bs4 import BeautifulSoup

def debug_schedule_page():
    url = "https://kabutan.jp/warning/?mode=5_1"
    print(f"Fetching {url}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding
        soup = BeautifulSoup(res.text, 'html.parser')

        print("\n[Searching for Date info]")
        
        # 1. Print ALL Headers (h1-h4)
        for i in range(1, 5):
            tags = soup.find_all(f'h{i}')
            for t in tags:
                print(f"<{t.name}>: {t.get_text().strip()}")
        
        # 2. Check Table Caption
        table = soup.find('table', class_='tablesorter')
        if not table:
             tables = soup.find_all('table') # Fallback
             for t in tables:
                 if 'コード' in t.get_text(): table = t; break
        
        if table:
            caption = table.find('caption')
            if caption:
                print(f"Table Caption: {caption.get_text().strip()}")
            else:
                print("No table caption.")
                
            # Check previous sibling of table?
            prev = table.find_previous_sibling()
            if prev:
                print(f"Table Previous Sibling ({prev.name}): {prev.get_text().strip()[:50]}...")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_schedule_page()
