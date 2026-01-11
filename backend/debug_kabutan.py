import requests
from bs4 import BeautifulSoup

def debug_page():
    url = "https://kabutan.jp/news/?date=20241225&category=3"
    print(f"Fetching {url}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    res = requests.get(url, headers=headers)
    print(f"Status: {res.status_code}")
    
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # 1. Check for 'main_body' specifically
    main_body = soup.find('div', {'class': 'main_body'})
    if main_body:
        print("Found div.main_body!")
    else:
        print("div.main_body NOT found.")
        
    # 2. List top-level divs to guess the structure
    print("\n--- Top Level Divs ---")
    body = soup.find('body')
    if body:
        for child in body.find_all('div', recursive=False):
             classes = child.get('class', [])
             ids = child.get('id', '')
             print(f"Div - ID: {ids}, Class: {classes}")
             
    # 3. Search for a known stock link to see where it lives
    # On 2024-12-25, looks like there were some announcements.
    # Let's search for "決算" text and find its parent.
    print("\n--- Searching for '決算' link parents ---")
    link = soup.find('a', string=lambda t: t and '決算' in t)
    if link:
        print(f"Found link: {link.get_text().strip()[:20]}...")
        parents = []
        p = link.parent
        while p and p.name != 'body':
            name = p.name
            classes = p.get('class', [])
            ids = p.get('id', '')
            parents.append(f"{name} (id={ids}, class={classes})")
            p = p.parent
        print("Path: " + " -> ".join(parents))
    else:
        print("No link with '決算' found.")

if __name__ == "__main__":
    debug_page()
