import requests
from bs4 import BeautifulSoup

def debug_schedule_page():
    url = "https://kabutan.jp/warning/?mode=5_1"
    print(f"Fetching {url}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 1. Look for the main table
        table = soup.find('table', class_='tablesorter')
        if not table:
             # Fallback
            tables = soup.find_all('table')
            for t in tables:
                if 'コード' in t.get_text():
                    table = t
                    break
        
        if table:
            print("\n[Table Found]")
            
            # Check Headers
            thead = table.find('thead')
            if thead:
                headers = [th.get_text().strip() for th in thead.find_all(['th', 'td'])]
                print(f"Headers: {headers}")
            else:
                # Try first row as header
                first_row = table.find('tr')
                if first_row:
                    headers = [c.get_text().strip() for c in first_row.find_all(['th', 'td'])]
                    print(f"First Row (Header?): {headers}")

            # Check content rows
            rows = table.find_all('tr')
            print(f"Total Rows: {len(rows)}")
            
            print("\n[Sample Rows (First 5)]")
            count = 0
            for row in rows:
                cols = row.find_all('td')
                if not cols: continue
                
                row_data = [c.get_text().strip() for c in cols]
                print(row_data)
                count += 1
                if count >= 5: break
        else:
            print("No suitable table found.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_schedule_page()
