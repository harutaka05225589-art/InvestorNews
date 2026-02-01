import requests
from bs4 import BeautifulSoup
import re

def check_jpx():
    url = "https://www.jpx.co.jp/listing/event-schedules/financial-announcement/index.html"
    print(f"Checking {url}...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, 'html.parser')
    
    links = soup.find_all('a', href=re.compile(r'\.xlsx$'))
    print(f"Found {len(links)} Excel files:")
    for l in links:
        print(f" - {l.text.strip()} : {l.get('href')}")

if __name__ == "__main__":
    check_jpx()
