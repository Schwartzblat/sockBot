# import required modules
from bs4 import BeautifulSoup
import requests
import sys
import os
languages = {
    "he": {
        'title': 'מיוחד:חיפוש',
        'url': 'https://he.wikipedia.org/w/index.php',
        'mean': 'האם התכוונתם ל...',
        'ends': ['ראו_גם','קישורים_חיצוניים','הערות_שוליים']
    },
    "en": {
        'title': 'Special:Search',
        'url': 'https://en.wikipedia.org/w/index.php',
        'mean': 'may refer to',
        'ends': ['See_also','Further_reading','References']
    },
    "es": {
        'title': 'Especial:Buscar',
        'url': 'https://es.wikipedia.org/w/index.php',
        'mean': 'puede referirse a',
        'ends': ['Véase_también', 'Referencias', 'Enlaces_externos']
    },
    "ru": {
        'title': 'Служебная:Поиск',
        'url': 'https://ru.wikipedia.org/w/index.php',
        'mean': 'может означать',
        'ends': ['См._также', 'Примечания', 'Ссылки']
    }
}


def getWiki(value, num):
    lan = "he"
    query = {
        'title': languages[lan]["title"],
        'search': value
    }
    # get URL
    res = requests.get(languages[lan]["url"], params=query)
    if res.status_code != 200:
        exit()
    # scrape webpage
    soup = BeautifulSoup(res.text, 'html.parser')
    try:
        obj = soup.find_all("div", {"class": 'mw-parser-output'})[0]
        if languages[lan]['mean'] in obj.find_all("p")[0].getText().strip():
            if lan == 'he':
                nodisambig = soup.find("div", {"class": "nodisambig"})
                url = 'https://'+lan+'.wikipedia.org' + str(nodisambig.find_all("li")[0].find('a', href=True)['href'])
            else:
                nodisambig = soup.find_all("ul")[0]
                url = 'https://' + lan + '.wikipedia.org' + str(
                    nodisambig.find_all("li")[0].find('a', href=True)['href'])
            res = requests.get(url)
            soup = BeautifulSoup(res.text, 'html.parser')
            obj = soup.find_all("div", {"class": 'mw-parser-output'})[0]
    except IndexError:
        try:
            page = soup.find_all('div', {'class', 'mw-search-result-heading'})[0]
            url = 'https://'+lan+'.wikipedia.org' + str(page.find('a', href=True)['href'])
            res = requests.get(url)
            soup = BeautifulSoup(res.text, 'html.parser')
            obj = soup.find_all("div", {"class": 'mw-parser-output'})[0]
        except Exception:
            return "Not Found"

    par = []
    for child in obj.children:
        if child.name == 'h2':
            childId = child.findChild('span', {'class': 'mw-headline'}).get('id')
            if childId in languages[lan]['ends']:
                break
            par.append("\n*" + child.getText() + "*\n")
        if child.name == 'p' or child.name == 'ul' or child.name == 'blockquote':
            par.append(child.getText())

    # i = 0
    # while i < len(par):
    #     if len(par[i]) < 30:
    #         print(par[i])
    #         par.pop(i)
    #         continue
    #     i += 1
    par = par[0:int(num)]
    file = open(os.path.join(os.path.dirname(__file__), 'temp.txt'), 'w', encoding='utf-8')
    for item in par:
        file.write(item+'\n')
    file.close()
value = " ".join(sys.argv[2:])
num = int(sys.argv[1])
getWiki(value, num)


