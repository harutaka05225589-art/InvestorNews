import requests
from bs4 import BeautifulSoup
import re
import codecs

url = "https://kabutan.jp/stock/holder?code=130A"
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get(url, headers=headers)
soup = BeautifulSoup(res.content.decode('utf-8'), 'html.parser')

with codecs.open('test_output.txt', 'w', 'utf-8') as f:
    for t in soup.find_all('table'):
        if '株主' in t.text or '持株比率' in t.text:
            for row in t.find_all('tr')[:5]:
                cells = row.find_all(['th', 'td'])
                f.write(str([c.text.strip() for c in cells]) + '\n')
