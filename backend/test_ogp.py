import urllib.request
import re
import time
import ssl
import sys

# Windows console encoding fix
sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    print("Fetching /revisions...")
    req = urllib.request.Request('https://rich-investor-news.com/revisions', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
    match = re.search(r'href=\"/revisions/(\d+)\"', html)
    
    if match:
        rev_id = match.group(1)
        print(f"Found revision: {rev_id}")
        
        start = time.time()
        req2 = urllib.request.Request(f'https://rich-investor-news.com/revisions/{rev_id}', headers={'User-Agent': 'Twitterbot/1.0'})
        html2 = urllib.request.urlopen(req2, context=ctx).read().decode('utf-8')
        end = time.time()
        
        print(f"Page Fetch Time: {end - start:.2f} seconds")
        
        og_url = None
        for line in html2.split('\n'):
            if 'og:image' in line or 'twitter:card' in line or 'og:title' in line:
                print(line.strip())
            if 'og:image' in line:
                m = re.search(r'content=\"([^\"]+)\"', line)
                if m: og_url = m.group(1)
                
        if og_url:
            print(f"\nFetching OGP Image: {og_url}")
            og_url = og_url.replace('&amp;', '&')
            start2 = time.time()
            try:
                # Use a proper user agent to simulate twitterbot
                img_req = urllib.request.Request(og_url, headers={'User-Agent': 'Twitterbot/1.0'})
                urllib.request.urlopen(img_req, context=ctx, timeout=10).read()
                end2 = time.time()
                print(f"OGP Image Fetch Time: {end2 - start2:.2f} seconds")
            except Exception as e2:
                print(f"OGP Fetch Error: {e2}")
    else:
        print("No revisions found")
except Exception as e:
    print(f"Error: {e}")
