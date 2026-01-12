import requests
from bs4 import BeautifulSoup
import re

def test_sbi_url():
    # URL provided by user
    # We might need to keep the complex params
    target_date = "20260114"
    # Reconstruct url with dynamic date if possible, but first test the exact link provided
    url = "https://www.sbisec.co.jp/ETGate/?_ControlID=WPLETmgR001Control&_PageID=WPLETmgR001Mdtl20&_DataStoreID=DSWPLETmgR001Control&_ActionID=DefaultAID&burl=iris_economicCalendar&cat1=market&cat2=economicCalender&dir=tl1-cal%7Ctl2-schedule%7Ctl3-stock%7Ctl4-calsel%7Ctl9-202601%7Ctl10-20260114&file=index.html&getFlg=on"
    
    print(f"Testing SBI URL: {url}")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0'
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = 'cp932' # Japanese sites often use Shift_JIS/CP932
        
        print(f"Status: {res.status_code}")
        soup = BeautifulSoup(res.text, 'html.parser')
        
        title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
        print(f"Title: {title}")
        
        # Try to find table with earnings
        # Look for Ticker (4 digits)
        text_preview = soup.get_text()[:500]
        print(f"Text Preview: {text_preview.replace(chr(10), ' ')}")
        
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables.")
        
        found_data = False
        for i, table in enumerate(tables):
            rows = table.find_all('tr')
            if len(rows) > 3: # Likely a data table
                # Check headers or content
                sample_text = table.get_text()
                if "コード" in sample_text or "銘柄" in sample_text:
                     print(f"  Table {i} looks promising (Rows: {len(rows)})")
                     for row in rows[:5]:
                         cols = row.find_all(['td', 'th'])
                         col_txts = [c.get_text().strip() for c in cols]
                         print(f"    Row: {col_txts}")
                     found_data = True
        
        if not found_data:
            print("No obvious data tables found. Page might be dynamic or require login.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_sbi_url()
