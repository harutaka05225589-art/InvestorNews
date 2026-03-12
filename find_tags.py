from bs4 import BeautifulSoup
import re

with open('test_s100uju5.html', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'lxml')
    
target = soup.find(string=re.compile('大株主の状況'))
if target:
    table = target.find_next('table')
    if table:
        rows = table.find_all('tr')
        if len(rows) > 1:
            data_row = rows[1]
            cells = data_row.find_all('td')
            with open('found_markup.txt', 'w', encoding='utf-8') as out:
                out.write("--- CELL 1 HTML ---\n")
                out.write(cells[0].prettify())
                if len(cells) >= 3:
                     out.write("\n--- CELL 3 HTML ---\n")
                     out.write(cells[2].prettify())
            print("Wrote markup to found_markup.txt safely.")
