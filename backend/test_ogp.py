import requests

url = "https://rich-investor-news.com/api/og?title=Test&subtitle=Test&type=alert"
try:
    print(f"Checking URL: {url}")
    r = requests.get(url, timeout=10)
    print(f"Status Code: {r.status_code}")
    print(f"Content-Type: {r.headers.get('Content-Type')}")
    print(f"Content-Length: {len(r.content)} bytes")
except Exception as e:
    print(f"Error: {e}")
