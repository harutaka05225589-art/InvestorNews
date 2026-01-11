import requests
from bs4 import BeautifulSoup

url = "https://kabutan.jp/news/?date=20241225&category=3"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
try:
    res = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {res.status_code}")
    res.encoding = res.apparent_encoding
    
    soup = BeautifulSoup(res.text, 'html.parser')
    print(f"Page Title: {soup.title.string.strip() if soup.title else 'No Title'}")
    
    print("\n--- All Div Classes (First 20) ---")
    divs = soup.find_all('div')
    for i, d in enumerate(divs[:20]):
        print(f"Div {i}: class={d.get('class', [])} id={d.get('id', '')}")

    print("\n--- Searching for 'main_body' ---")
    mb = soup.find('div', class_='main_body')
    if mb:
        print("Found main_body!")
    else:
        print("Not found main_body.")

except Exception as e:
    print(f"Error: {e}")
