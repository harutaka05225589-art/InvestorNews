import bs4

with open('test_3583.html', encoding='utf-8') as f:
    soup = bs4.BeautifulSoup(f, 'html.parser')
    
for i, table in enumerate(soup.find_all('table')):
    text = table.get_text()
    if '昭和化学' in text:
        print(f"Target Table Found at index {i}")
        print("Classes:", table.get('class'))
        rows = table.find_all('tr')
        if rows:
            print("First Row Header Texts:")
            cols = rows[0].find_all(['th', 'td'])
            print([c.get_text().strip() for c in cols])
        break
