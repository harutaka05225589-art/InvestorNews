import requests
import datetime

def test_edinet():
    # EDINET API V2 List Endpoint
    # We need to ask for a specific date. Let's try "yesterday" (usually safe for available data)
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    date_str = yesterday.strftime('%Y-%m-%d')
    url = f"https://disclosure.edinet-fsa.go.jp/api/v2/documents.json?date={date_str}&type=2"
    
    print(f"Testing EDINET API: {url}")
    
    # Try without key first (some endpoints might be open or rate limited)
    try:
        res = requests.get(url, timeout=10)
        print(f"Status Code: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print("Success! Metadata keys:", data.keys())
            if 'results' in data:
                print(f"Found {len(data['results'])} documents.")
                # Show first result
                if data['results']:
                    print("Sample Doc:", data['results'][0])
        else:
            print("Failed:", res.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_edinet()
