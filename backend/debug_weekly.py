import requests
from bs4 import BeautifulSoup

def check_weekly(date_param=None):
    url = "https://kabutan.jp/warning/?mode=5_2"
    if date_param:
        url += f"&date={date_param}"
    
    print(f"\nChecking Weekly: {url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
        h1 = soup.find('h1').get_text().strip() if soup.find('h1') else "No H1"
        print(f"  Title: {title[:30]}... | H1: {h1}")
        
        # Check for dates in table headers
        th_dates = [th.get_text().strip() for th in soup.find_all('th') if '月' in th.get_text() and '日' in th.get_text()]
        print(f"  Dates in headers: {th_dates[:5]}...")

        # Check for "Next Week" link
        next_link = soup.find('a', string="翌週")
        if next_link:
            print(f"  Found Next Week link: {next_link.get('href')}")
        else:
            print("  '翌週' link not found.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_weekly()
    check_weekly("20260120")
