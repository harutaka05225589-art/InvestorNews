import requests
from bs4 import BeautifulSoup
import re
import pandas as pd
import io

def check_jpx_excel():
    base_url = "https://www.jpx.co.jp"
    page_url = "https://www.jpx.co.jp/listing/event-schedules/financial-announcement/index.html"
    
    print(f"Fetching JPX Page: {page_url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        res = requests.get(page_url, headers=headers)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Find all excel links
        links = soup.find_all('a', href=re.compile(r'\.xlsx$'))
        print(f"Found {len(links)} Excel files.")
        
        target_found = False
        
        for i, link in enumerate(links):
            file_url = base_url + link.get('href')
            print(f"\n[{i+1}] Downloading: {file_url}")
            
            # Download file into memory
            f_res = requests.get(file_url, headers=headers)
            if f_res.status_code != 200:
                print("  Failed download.")
                continue
                
            try:
                # Read with pandas
                df = pd.read_excel(io.BytesIO(f_res.content))
                print(f"  Columns: {list(df.columns)}")
                print(f"  Rows: {len(df)}")
                
                # Normalize column names (sometimes they are in row 1 or 2)
                # Look for a column that contains 4-digit codes
                # Usually column names are "コード", "会社名", "決算発表予定日"
                
                # Check headers matches
                # If headers are not parsed correctly, we might need to skip rows
                # But let's simple string search first
                
                # Convert to string for searching
                df_str = df.astype(str)
                
                # Look for 7203
                toyota = df_str[df_str.apply(lambda row: row.astype(str).str.contains('7203').any(), axis=1)]
                
                if not toyota.empty:
                    print("  SUCCESS! Found Toyota (7203):")
                    print(toyota.iloc[0].to_string())
                    target_found = True
                    # Try to identify Date column
                    # Look for date like '2026/02/06' or '2/6'
                else:
                    print("  Toyota not found in this file.")
                    
                # Print sample distinct dates to confirm it has future data
                # Try to find a date column
                # Heuristic: Column with "日" or "Date"
                
            except Exception as e:
                print(f"  Error reading Excel: {e}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_jpx_excel()
