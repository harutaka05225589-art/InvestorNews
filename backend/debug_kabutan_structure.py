
import requests
from bs4 import BeautifulSoup
import re

def debug_kabutan(ticker):
    url = f"https://kabutan.jp/stock/?code={ticker}"
    print(f"Fetching {url}")
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    with open("kabutan_dump.html", "w", encoding="utf-8") as f:
        f.write(res.text)
    print("Saved kabutan_dump.html")
    print(f"Status: {res.status_code}")
    if "決算" in res.text:
        print("Found '決算' in res.text!")
        # Find all occurrences
        for m in re.finditer("決算", res.text):
            start = max(0, m.start() - 50)
            end = min(len(res.text), m.end() + 100)
            print(f"Match at {m.start()}:")
            print(f"Context (repr): {repr(res.text[start:end])}")
    else:
        print("Did NOT find '決算' in res.text.")
        
        # Try finding 'Settlement' or other keywords?
        # Try searching for the th tag
        print("Searching for <th using regex...")
        match = re.search(r'<th[^>]*>(.*?)</th>', res.text)
        if match:
            print(f"First TH content: {match.group(1)}")

if __name__ == "__main__":
    debug_kabutan("1726")
