import requests
from bs4 import BeautifulSoup
import codecs

url = "https://kabutan.jp/stock/finance?code=130A"
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get(url, headers=headers)
soup = BeautifulSoup(res.content.decode('utf-8'), 'html.parser')

with codecs.open('finance_test.txt', 'w', 'utf-8') as f:
    for t in soup.find_all('table'):
        if '決算期' in t.text or '売上高' in t.text:
            f.write("=== TABLE ===\n")
            for row in t.find_all('tr')[:10]:
                cells = row.find_all(['th', 'td'])
                f.write(str([c.text.strip() for c in cells]) + '\n')
