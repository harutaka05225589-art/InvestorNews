import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re

def check_traders_deep():
    # URL found in search
    url = "https://www.traders.co.jp/domestic_stocks/domestic_market/kessan_s/kessan_s.asp" # Check existing one again just in case
    # Search result [1] says: https://www.traders.co.jp/market_info/calendar/settlement/settlement_menu.html
    # But search result [1] link text is "決算発表スケジュール | 国内市場..." which matches the title of the ASP page.
    # The URL structure might have changed. Let's try to find links from the ASP page.
    
    print(f"\nChecking Traders Web: {url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding
        soup = BeautifulSoup(res.text, 'html.parser')
        
        title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
        print(f"Title: {title}")
        
        # 1. Print all internal links to see navigation
        print("--- Navigation Links ---")
        links = soup.find_all('a', href=True)
        for l in links:
            href = l.get('href')
            text = l.get_text().strip()
            # Filter broadly
            if "kessan" in href or "schedule" in href or "月" in text:
                print(f"Link: [{text}] -> {href}")
                
        # 2. Try to guess/construct "Next Month" URL
        # Usually asp pages use params like ?k_im=202602
        test_url = "https://www.traders.co.jp/domestic_stocks/domestic_market/kessan_s/kessan_s.asp?k_im=202602"
        print(f"\nTesting guessed URL: {test_url}")
        res2 = requests.get(test_url, headers=headers)
        res2.encoding = res2.apparent_encoding
        soup2 = BeautifulSoup(res2.text, 'html.parser')
        
        body_text = soup2.get_text()
        dates = re.findall(r'\d{1,2}月\d{1,2}日', body_text)
        print(f"Dates found: {dates[:10]}...")
        
        if "7203" in body_text or "トヨタ" in body_text:
            print("SUCCESS: Found Toyota/7203 in guessed URL!")
        else:
            print("Toyota not found in guessed URL.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_traders_deep()
