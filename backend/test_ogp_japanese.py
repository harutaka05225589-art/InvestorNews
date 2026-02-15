import requests
import urllib.parse

title = "テストタイトル"
subtitle = "これはテストです。日本語が表示されるか確認します。"
encoded_title = urllib.parse.quote(title)
encoded_subtitle = urllib.parse.quote(subtitle)

url = f"https://rich-investor-news.com/api/og?title={encoded_title}&subtitle={encoded_subtitle}&type=alert"

try:
    print(f"Checking URL: {url}")
    # User-Agent to mimic Twitterbot or generic browser
    headers = {'User-Agent': 'Mozilla/5.0 (compatible; Twitterbot/1.0)'}
    r = requests.get(url, headers=headers, timeout=15)
    print(f"Status Code: {r.status_code}")
    print(f"Content-Type: {r.headers.get('Content-Type')}")
    print(f"Content-Length: {len(r.content)} bytes")
    
    # Check if content is actually an image (PNG header)
    if r.content.startswith(b'\x89PNG'):
        print("Header: Valid PNG")
    else:
        print(f"Header: INVALID! Start bytes: {r.content[:10]}")
        print(f"Body: {r.text[:200]}")

except Exception as e:
    print(f"Error: {e}")
