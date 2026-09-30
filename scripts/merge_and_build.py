import os
import re
import csv
import json
import hashlib
import glob

# Script to merge all supplier parts and generate initialProducts.ts and products.json

def clean_row(parts):
    if len(parts) < 4:
        return None
    team_cat = parts[0].strip()
    title = parts[1].strip()
    yupoo_link = parts[2].strip()
    img_url = parts[3].strip()

    if not title or title.lower() in ['titulo', 'title', '加密相册']:
        return None
    if not yupoo_link and not img_url:
        return None
    return {
        'team_cat': team_cat,
        'title': title,
        'yupoo_link': yupoo_link,
        'img_url': img_url
    }

def extract_sizes(title):
    title_lower = title.lower()
    if 'size 16-28' in title_lower or 'size: 16-28' in title_lower or 'size：16-28' in title_lower or '16-28' in title_lower or 'kids' in title_lower or 'size 16-30' in title_lower:
        return ['16 (3-4a)', '18 (4-5a)', '20 (5-6a)', '22 (7-8a)', '24 (9-10a)', '26 (11-12a)', '28 (12-13a)']
    if 'baby' in title_lower or '9/12' in title_lower or '912' in title_lower:
        return ['3-6m', '6-9m', '9-12m', '12-18m']
    if 's-6xl' in title_lower:
        return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL']
    if 's-5xl' in title_lower:
        return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
    if 's-4xl' in title_lower or 's-xxxxl' in title_lower:
        return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
    if 's-3xl' in title_lower or 's-xxxl' in title_lower or 'm-3xl' in title_lower:
        return ['S', 'M', 'L', 'XL', '2XL', '3XL']
    if 's-xxl' in title_lower or 's-2xl' in title_lower or 's-xl' in title_lower:
        return ['S', 'M', 'L', 'XL', '2XL']
    if 'm-4xl' in title_lower:
        return ['M', 'L', 'XL', '2XL', '3XL', '4XL']
    return ['S', 'M', 'L', 'XL', '2XL']

def determine_section_and_category(title, url):
    title_lower = title.lower()
    sections = []
    
    # Category detection
    if 'retro' in title_lower or any(yr in title_lower for yr in ['70', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '00/01', '01/02', '02/03', '03/04', '04/05', '05/06', '06/07', '07/08', '08/09', '09/10', '10/11', '11/12', '12/13', '13/14', '14/15', '15/16', '16/17', '17/18', '18/19', '19/20', '20/21', '21/22', '22/23']):
        category = 'Camiseta Retro'
        sections.append('Retro')
    elif 'windbreaker' in title_lower or 'training pants' in title_lower or 'jacket' in title_lower or 'chándal' in title_lower or 'trench coat' in title_lower or 'sweatshirt' in title_lower or 'training suit' in title_lower or 'training wear' in title_lower or 'training kit' in title_lower or 'warm up' in title_lower or 'hoodie' in title_lower:
        category = 'Cortavientos / Chándal'
        sections.append('Ropa Entrenamiento & Cortavientos')
    elif 't-shirt' in title_lower or 'polo' in title_lower or 'baseball' in title_lower or 'vest' in title_lower or 'crop' in title_lower or 'casual' in title_lower:
        category = 'Ropa de Moda / Streetwear'
        sections.append('Ropa de Moda')
    elif '26/27' in title_lower:
        category = 'Camiseta 26/27'
        sections.append('Temporada 26/27')
    elif '25/26' in title_lower:
        category = 'Camiseta 25/26'
        sections.append('Temporada 25/26')
    else:
        category = 'Camiseta 26/27'

    # Section by League / Team
    if 'referrercate=680717' in url or any(w in title_lower for w in ['madrid', 'barcelona', 'atlético de madrid', 'atletico de madrid', 'atletico madrid', 'sevilla', 'betis', 'bilbao', 'sociedad', 'valencia', 'villarreal', 'laliga', 'las palmas', 'mallorca', 'celta', 'girona', 'osasuna', 'alavés', 'alaves', 'granada', 'zaragoza', 'valladolid', 'gijon', 'gijón', 'espanyol', 'cadiz', 'cádiz', 'elche', 'cordoba', 'córdoba', 'malaga', 'málaga', 'tenerife', 'albacete', 'huelva', 'leonesa', 'oviedo', 'racing de santander']):
        sections.append('LaLiga')
    elif 'referrercate=680719' in url or any(w in title_lower for w in ['manchester', 'm-u', 'arsenal', 'chelsea', 'liverpool', 'tottenham', 'newcastle', 'aston villa', 'wrexham', 'bolton', 'premier league', 'wolves', 'west ham', 'west bromwich', 'stoke city', 'nottingham forest', 'hull city', 'fulham', 'coventry', 'burnley', 'brighton', 'blackburn', 'bournemouth', 'sunderland', 'crystal palace', 'norwich', 'sheffield', 'derby county', 'birmingham', 'middlesbrough', 'cardiff', 'leeds', 'brentford', 'everton', 'portsmouth', 'leicester', 'ipswich', 'millwall', 'doncaster', 'plymouth', 'bradford', 'southampton', 'lincoln city']):
        sections.append('Premier League')
    elif 'referrercate=2897018' in url or any(w in title_lower for w in ['psg', 'paris', 'marseille', 'lyon', 'lyonnais', 'monaco', 'lille', 'lens', 'rennes', 'rennais', 'strasbourg', 'toulouse', 'nice', 'bordeaux', 'cannes', 'saint-etienne', 'ligue 1', 'nantes']):
        sections.append('Ligue 1')
    elif 'referrercate=708736' in url or any(w in title_lower for w in ['milan', 'juventus', 'inter', 'roma', 'napoli', 'lazio', 'fiorentina', 'atalanta', 'parma', 'serie a', 'sampdoria', 'torino', 'perugia', 'como', 'cagliari', 'bologna', 'palermo', 'padova', 'cremonese', 'venezia', 'venice', 'bari', 'sassuolo', 'brescia', 'pisa']):
        sections.append('Serie A')
    elif 'referrercate=680725' in url or any(w in title_lower for w in ['bayern', 'dortmund', 'leverkusen', 'bochum', 'frankfurt', 'bundesliga', 'stuttgart', 'wattenscheid', 'tsv 1860', 'werder bremen', 'mönchengladbach', 'monchengladbach', 'schalke', 'hamburg', 'hamburger', 'st. pauli', 'st pauli', 'köln', 'koln', 'nürnberg', 'nurnberg', 'hoffenheim', 'düsseldorf', 'dusseldorf', 'hannover', 'kaiserslautern', 'freiburg', 'wolfsburg', 'rostock', 'hansa', 'holstein kiel', 'essen', 'leipzig']):
        sections.append('Bundesliga')
    elif 'referrercate=3302915' in url or any(w in title_lower for w in ['boca', 'river plate', 'racing club', 'independiente', 'san lorenzo', 'rosario central', 'newell', 'estudiantes', 'argentinos juniors', 'vélez', 'velez']):
        sections.append('Liga Profesional ARG')
    elif 'referrercate=3302977' in url or any(w in title_lower for w in ['benfica', 'porto', 'sporting cp', 'sporting lisbon', 'braga', 'famalicao', 'alverca', 'vitoria sc', 'guimarães', 'guimaraes']):
        sections.append('Primeira Liga')
    elif 'referrercate=3302916' in url or any(w in title_lower for w in ['ajax', 'psv', 'feyenoord', 'eredivisie', 'eindhoven', 'hereja']):
        sections.append('Eredivisie')
    elif 'referrercate=3452090' in url or any(w in title_lower for w in ['rangers', 'celtic', 'celtics', 'aberdeen', 'hearts', 'dundee united']):
        sections.append('Liga Escocesa')
    elif 'referrercate=3247384' in url or any(w in title_lower for w in ['chicago fire', 'toronto', 'inter miami', 'miami', 'la galaxy', 'galaxy', 'atlanta united', 'sounders', 'mls', 'san diego fc', 'san diego', 'los angeles fc', 'los angeles', 'cf montreal', 'orlando pirates', 'charlotte', 'red bull new york', 'new york red bulls', 'new york city']):
        sections.append('MLS')
    elif 'referrercate=2827820' in url or any(w in title_lower for w in ['yokohama', 'vissel kobe', 'kobe', 'urawa', 'kawasaki frontale', 'kashima antlers', 'shimizu', 'sanfrecce hiroshima', 'nagoya grampus', 'kyoto sanga', 'kashiwa reysol', 'gamba osaka', 'cerezo osaka', 'avispa fukuoka', 'fc tokyo', 'japon', 'yakos']):
        sections.append('Japon League')
    elif 'referrercate=3302917' in url or any(w in title_lower for w in ['club america', 'américa', 'america', 'chivas', 'cruz azul', 'tigres', 'monterrey', 'pumas', 'toluca', 'santos laguna', 'club león', 'club leon', 'león', 'leon', 'atlante', 'atlas', 'san luis', 'tijuana', 'liga mx']):
        sections.append('Liga MX')
    elif 'referrercate=3703045' in url or any(w in title_lower for w in ['colo colo', 'universidad de chile', 'universidad católica', 'universidad catolica', 'deportivo universidad católica', 'o\'higgins', 'chile 1998', 'chile 1982', 'chile 2014', 'chile 16/17']):
        sections.append('Liga Profesional ARG')  # Put South American clubs in proper category
    elif 'referrercate=680738' in url or any(w in title_lower for w in ['palmeiras', 'flamengo', 'corinthians', 'sao paulo', 'são paulo', 'santos', 'gremio', 'cruzeiro', 'vasco da gama', 'vasco', 'botafogo', 'bahia', 'atletico mineiro', 'atlético mineiro', 'fluminense', 'internacional', 'sport recife', 'vitoria', 'vitória', 'remo', 'paysandu', 'santa cruz', 'nautico', 'náutico', 'cuiabá', 'chapecoense', 'fortaleza', 'ceará', 'red bull bragantino']):
        sections.append('Temporada 26/27')
    elif 'referrercate=5062328' in url or 'referrercate=5211803' in url or any(w in title_lower for w in ['spain', 'españa', 'argentina', 'brazil', 'brasil', 'portugal', 'germany', 'england', 'italy', 'france', 'netherlands', 'holland', 'world cup', 'mundial', 'mexico', 'méxico', 'colombia', 'belgium', 'japan', 'algeria', 'scotland', 'switzerland', 'canada', 'austria', 'croatia', 'uruguay', 'australia', 'jordan', 'panama', 'ecuador', 'south africa', 'saudi arabia', 'peru', 'jamaica', 'sweden', 'usa', 'venezuela', 'norway', 'south korea', 'qatar', 'curacao', 'iraq', 'turkey', 'haiti', 'cape verde', 'ghana', 'czech republic', 'tunisia', 'chile', 'ivory coast', 'hungary', 'cameroon', 'morocco', 'uzbekistan', 'iran', 'wales', 'congo', 'costa rica', 'finland', 'israel', 'senegal', 'guatemala', 'romania', 'ireland']):
        sections.append('Mundial 2026')
    else:
        sections.append('Temporada 26/27')

    # Remove duplicates and ensure 'Populares' is empty
    dedup_sections = []
    for s in sections:
        if s != 'Populares' and s not in dedup_sections:
            dedup_sections.append(s)

    primary_section = dedup_sections[0] if dedup_sections else 'Temporada 26/27'
    return primary_section, dedup_sections, category

def extract_team(title):
    t = title.split('26/27')[0].split('25/26')[0].split('24/25')[0].split('23/24')[0].split('22/23')[0].split('21/22')[0].split('20/21')[0].split('19/20')[0].split('18/19')[0].split('17/18')[0].split('16/17')[0].split('15/16')[0].split('14/15')[0].split('13/14')[0].split('12/13')[0].split('11/12')[0].split('10/11')[0].split('09/10')[0].split('08/09')[0].split('07/08')[0].split('06/07')[0].split('05/06')[0].split('04/05')[0].split('03/04')[0].split('02/03')[0].split('01/02')[0].split('00/01')[0].split('99/00')[0].split('98/99')[0].split('97/98')[0].split('96/97')[0].split('95/96')[0].split('94/95')[0].split('93/94')[0].split('92/93')[0].split('91/92')[0].split('90/91')[0].split('Retro')[0].split('retro')[0]
    t = re.sub(r'\b(Player|Version|Home|Away|Third|Special|Edition|Kids|Kit|Training|Pants|Windbreaker|POLO|T-Shirt|Jersey|Size|S-XXL|S-3XL|S-4XL|S-5XL|16-28|Shorts|Long Sleeve|Long-Sleeve|Sleeves|All sponsors)\b', '', t, flags=re.IGNORECASE)
    t = t.strip(' -_')
    return t if t else 'Fútbol'

def extract_season(title):
    match = re.search(r'\b(26/27|25/26|24/25|23/24|22/23|21/22|20/21|19/20|18/19|17/18|16/17|15/16|14/15|13/14|12/13|11/12|10/11|09/10|08/09|07/08|06/07|05/06|04/05|03/04|02/03|01/02|00/01|99/00|98/99|97/98|96/97|95/96|94/95|93/94|92/93|91/92|90/91|89/90|88/89|87/88|86/87|85/86|84/85|83/84|82/83|81/82|80/81|1998|1996|1994|1992|1990|1988|1986|1984|1982|1980|1978|1970|2026|2025|2024|2022|2010|2006|2002|2000)\b', title)
    return match.group(0) if match else '26/27'

def build_product(raw, idx):
    title = raw['title']
    url = raw['yupoo_link']
    img = raw['img_url']
    
    primary_sec, all_secs, category = determine_section_and_category(title, url)
    team = extract_team(title)
    season = extract_season(title)
    sizes = extract_sizes(title)
    
    h = hashlib.md5(f"{title}_{url}".encode('utf-8')).hexdigest()[:10]
    pid = f"prod_kang_{h}"
    
    is_retro = 'Retro' in all_secs or 'retro' in title.lower()
    is_player = 'player' in title.lower() or 'match' in title.lower()
    
    # Custom editions
    if is_player:
        available_editions = ['PLAYER VERSION', 'FAN VERSION']
    else:
        available_editions = ['FAN VERSION', 'PLAYER VERSION']
        
    return {
        'id': pid,
        'title': title,
        'team': team,
        'season': season,
        'section': primary_sec,
        'sections': all_secs,
        'category': category,
        'price': 24.99,
        'costPrice': 9.50,
        'imageUrl': img,
        'additionalImages': [],
        'availableSizes': sizes,
        'isPopular': False,
        'featured': False,
        'isRetro': is_retro,
        'inStock': True,
        'qualityGrade': 'Calidad Oficial 1:1 Premium',
        'availableEditions': available_editions,
        'fanVersionDescription': 'Corte regular aficionado, escudos y parches bordados con tejido transpirable Climacool.',
        'playerVersionDescription': 'Corte entallado pro match, detalles termosellados en 3D y máxima ligereza.',
        'playerVersionExtraPrice': 0.0,
        'allowCustomDorsal': True,
        'dorsalExtraPrice': 0.0,
        'badgeOptions': ['Sin Parche', 'Parche Champions League (+0€)', 'Parche de Liga (+0€)', 'Parche Mundial 2026 (+0€)'],
        'notes': f"Catálogo Oficial: {url}" if url else "Catálogo Oficial Kang",
        'dateAdded': '2026-09-22T00:00:00.000Z'
    }

print("Merge and build script loaded.")
