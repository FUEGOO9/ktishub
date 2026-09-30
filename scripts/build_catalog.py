import csv
import json
import os
import re
import glob
import hashlib

def generate_id(title, url):
    h = hashlib.md5(f"{title}_{url}".encode('utf-8')).hexdigest()[:10]
    return f"prod_kang_{h}"

def extract_sizes(title):
    title_lower = title.lower()
    if 'size 16-28' in title_lower or 'size: 16-28' in title_lower or '16-28' in title_lower or 'kids' in title_lower:
        return ['16 (3-4a)', '18 (4-5a)', '20 (5-6a)', '22 (7-8a)', '24 (9-10a)', '26 (11-12a)', '28 (12-13a)']
    if 'baby' in title_lower or '9/12' in title_lower or '912' in title_lower:
        return ['3-6m', '6-9m', '9-12m', '12-18m']
    if 's-6xl' in title_lower:
        return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL']
    if 's-5xl' in title_lower:
        return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
    if 's-4xl' in title_lower:
        return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
    if 's-3xl' in title_lower or 's-xxxl' in title_lower:
        return ['S', 'M', 'L', 'XL', '2XL', '3XL']
    if 's-xxl' in title_lower or 's-2xl' in title_lower:
        return ['S', 'M', 'L', 'XL', '2XL']
    if 'm-4xl' in title_lower:
        return ['M', 'L', 'XL', '2XL', '3XL', '4XL']
    return ['S', 'M', 'L', 'XL', '2XL']

def determine_section_and_category(title, url):
    title_lower = title.lower()
    sections = []
    
    # 1. League / Federation / Competition Classification
    # Non-Spanish exclusion check first
    is_south_american = any(w in title_lower for w in [
        'national athletic', 'atletico nacional', 'atlético nacional', 'nacional de medellin',
        'peñarol', 'penarol', 'nacional uruguay', 'millonarios', 'santa fe', 'junior barranquilla',
        'america de cali', 'deportivo cali', 'liga de quito', 'barcelona sc', 'emelec', 'olimpia',
        'cerro porteño', 'cerro porteno', 'bolivar', 'the strongest', 'alianza lima', 'universitario'
    ])
    
    is_brazilian = any(w in title_lower for w in [
        'flamengo', 'palmeiras', 'corinthians', 'sao paulo', 'são paulo', 'gremio', 'grêmio',
        'fluminense', 'botafogo', 'cruzeiro', 'vasco', 'bahia', 'atletico mineiro', 'atlético mineiro',
        'athletico paranaense', 'atletico paranaense', 'bragantino', 'fortaleza', 'cuiaba', 'cuiabá',
        'juventude', 'sport recife', 'coritiba', 'goias', 'goiás', 'chapecoense', 'avai', 'avaí',
        'internacional', 'santos'
    ])

    # LaLiga (Strict Spanish Clubs Only)
    is_spanish_club = ('referrercate=680717' in url or any(w in title_lower for w in [
        'madrid', 'barcelona', 'barca', 'barça', 'atletico madrid', 'atlético madrid', 'atletico de madrid',
        'atlético de madrid', 'atleti', 'sevilla', 'betis', 'real betis', 'athletic bilbao', 'bilbao',
        'athletic club', 'sociedad', 'real sociedad', 'valencia', 'villarreal', 'laliga', 'la liga',
        'celta', 'celta vigo', 'mallorca', 'osasuna', 'alavés', 'alaves', 'rayo', 'vallecano',
        'palmas', 'las palmas', 'espanyol', 'getafe', 'leganés', 'leganes', 'valladolid', 'real valladolid',
        'deportivo la coruna', 'deportivo la coruña', 'deportivo coruna', 'deportivo de la coruna',
        'zaragoza', 'real zaragoza', 'málaga', 'malaga', 'sporting gijon', 'sporting gijón', 'gijon', 'gijón',
        'oviedo', 'real oviedo', 'cádiz', 'cadiz', 'elche', 'córdoba', 'cordoba', 'tenerife', 'albacete',
        'recreativo', 'racing santander', 'santander', 'eibar', 'almeria', 'almería', 'levante', 'granada',
        'mirandes', 'mirandés', 'burgos', 'huesca', 'castellon', 'castellón', 'don castello', 'eldense',
        'cartagena', 'cultural leonesa', 'real murcia'
    ])) and not is_south_american and not is_brazilian and 'atletico san luis' not in title_lower and 'cologne' not in title_lower

    if is_spanish_club:
        sections.append('LaLiga')
        
    # Premier League
    if 'referrercate=680719' in url or any(w in title_lower for w in [
        'manchester', 'm-u', 'm-c', 'arsenal', 'chelsea', 'liverpool', 'tottenham', 'spurs',
        'newcastle', 'aston villa', 'villa', 'wrexham', 'bolton', 'premier league', 'premier',
        'wolves', 'wolverhampton', 'west ham', 'west bromwich', 'west brom', 'stoke city',
        'stoke', 'nottingham', 'hull city', 'fulham', 'coventry', 'burnley', 'brighton',
        'blackburn', 'bournemouth', 'sunderland', 'crystal palace', 'norwich', 'sheffield',
        'derby county', 'birmingham', 'middlesbrough', 'cardiff', 'leeds', 'brentford',
        'everton', 'portsmouth', 'leicester', 'ipswich', 'millwall', 'doncaster', 'plymouth',
        'bradford', 'southampton', 'lincoln city', 'watford', 'qpr', 'luton'
    ]):
        sections.append('Premier League')

    # Serie A
    if 'referrercate=708736' in url or any(w in title_lower for w in [
        'milan', 'juventus', 'juve', 'inter', 'roma', 'napoli', 'lazio', 'fiorentina',
        'atalanta', 'parma', 'serie a', 'sampdoria', 'torino', 'perugia', 'como', 'cagliari',
        'bologna', 'palermo', 'padova', 'cremonese', 'venezia', 'venice', 'bari', 'sassuolo',
        'brescia', 'pisa', 'genoa', 'udinese', 'verona', 'monza', 'empoli', 'lecce'
    ]):
        sections.append('Serie A')

    # Ligue 1
    if 'referrercate=2897018' in url or any(w in title_lower for w in [
        'psg', 'paris', 'marseille', 'om ', 'lyon', 'lyonnais', 'monaco', 'lille', 'lens',
        'rennes', 'rennais', 'strasbourg', 'toulouse', 'nice', 'bordeaux', 'cannes',
        'saint-etienne', 'st etienne', 'ligue 1', 'ligue1', 'nantes', 'brest', 'auxerre',
        'le havre', 'reims', 'montpellier', 'angers'
    ]):
        sections.append('Ligue 1')

    # Bundesliga
    if 'referrercate=680725' in url or any(w in title_lower for w in [
        'bayern', 'dortmund', 'bvb', 'leverkusen', 'bochum', 'frankfurt', 'bundesliga',
        'stuttgart', 'wattenscheid', 'tsv 1860', '1860 munchen', 'werder bremen', 'bremen',
        'mönchengladbach', 'monchengladbach', 'gladbach', 'schalke', 'hamburg', 'hsv',
        'st. pauli', 'st pauli', 'köln', 'koln', 'nürnberg', 'nurnberg', 'hoffenheim',
        'düsseldorf', 'dusseldorf', 'hannover', 'kaiserslautern', 'freiburg', 'wolfsburg',
        'rostock', 'hansa', 'holstein kiel', 'essen', 'leipzig', 'union berlin', 'mainz',
        'heidenheim', 'augsburg'
    ]):
        sections.append('Bundesliga')

    # Liga Profesional ARG & South American Clubs
    if 'referrercate=3302915' in url or 'referrercate=3703045' in url or any(w in title_lower for w in [
        'boca', 'river plate', 'river', 'racing club', 'independiente', 'san lorenzo',
        'rosario central', 'rosario', 'newell', 'estudiantes', 'argentinos juniors',
        'vélez', 'velez', 'lanus', 'lanús', 'huracan', 'huracán', 'talleres', 'belgrano',
        'colo colo', 'universidad de chile', 'u de chile', 'universidad católica',
        'universidad catolica', 'catolica', 'o\'higgins'
    ]):
        sections.append('Liga Profesional ARG')

    # Primeira Liga
    if 'referrercate=3302977' in url or any(w in title_lower for w in [
        'benfica', 'porto', 'sporting cp', 'sporting lisbon', 'sporting lisboa', 'braga',
        'famalicao', 'famalicão', 'alverca', 'vitoria sc', 'vitoria guimaraes', 'guimarães',
        'guimaraes', 'boavista', 'primeira liga'
    ]):
        sections.append('Primeira Liga')

    # Eredivisie
    if 'referrercate=3302916' in url or any(w in title_lower for w in [
        'ajax', 'psv', 'feyenoord', 'eredivisie', 'eindhoven', 'az alkmaar', 'twente', 'utrecht'
    ]):
        sections.append('Eredivisie')

    # Liga Escocesa
    if 'referrercate=3452090' in url or any(w in title_lower for w in [
        'rangers', 'celtic', 'celtics', 'aberdeen', 'hearts', 'heart of midlothian', 'dundee'
    ]):
        sections.append('Liga Escocesa')

    # MLS
    if 'referrercate=3247384' in url or any(w in title_lower for w in [
        'chicago fire', 'toronto', 'inter miami', 'miami', 'la galaxy', 'galaxy',
        'atlanta united', 'sounders', 'mls', 'san diego', 'los angeles fc', 'lafc',
        'cf montreal', 'montreal', 'charlotte', 'red bull new york', 'new york red bulls',
        'new york city', 'nycfc', 'austin fc', 'portland timbers', 'columbus crew'
    ]):
        sections.append('MLS')

    # Liga MX
    if 'referrercate=3302917' in url or any(w in title_lower for w in [
        'club america', 'américa', 'america', 'chivas', 'guadalajara', 'cruz azul',
        'tigres', 'monterrey', 'rayados', 'pumas', 'unam', 'toluca', 'santos laguna',
        'club león', 'club leon', 'león', 'leon', 'atlante', 'atlas', 'san luis',
        'tijuana', 'liga mx', 'pachuca', 'necaxa', 'puebla'
    ]):
        sections.append('Liga MX')

    # Japon League
    if 'referrercate=2827820' in url or any(w in title_lower for w in [
        'yokohama', 'vissel kobe', 'kobe', 'urawa', 'kawasaki frontale', 'kawasaki',
        'kashima antlers', 'kashima', 'shimizu', 'sanfrecce', 'nagoya grampus', 'nagoya',
        'kyoto sanga', 'kashiwa reysol', 'gamba osaka', 'cerezo osaka', 'avispa fukuoka',
        'fc tokyo', 'japon league', 'j-league', 'j league'
    ]):
        sections.append('Japon League')

    # Mundial 2026 / Selecciones Nacionales
    if 'referrercate=5062328' in url or 'referrercate=5211803' in url or any(w in title_lower for w in [
        'spain', 'españa', 'espana', 'argentina', 'brazil', 'brasil', 'portugal', 'germany',
        'alemania', 'england', 'inglaterra', 'italy', 'italia', 'france', 'francia',
        'netherlands', 'holland', 'holanda', 'world cup', 'mundial', 'mexico', 'méxico',
        'colombia', 'belgium', 'bélgica', 'belgica', 'japan', 'japon', 'japón', 'algeria',
        'scotland', 'escocia', 'switzerland', 'suiza', 'canada', 'canadá', 'austria',
        'croatia', 'croacia', 'uruguay', 'australia', 'jordan', 'panama', 'panamá',
        'ecuador', 'south africa', 'saudi arabia', 'peru', 'perú', 'jamaica', 'sweden',
        'suecia', 'usa', 'estados unidos', 'venezuela', 'norway', 'noruega', 'south korea',
        'corea', 'qatar', 'curacao', 'curaçao', 'iraq', 'turkey', 'turquía', 'turquia',
        'haiti', 'haití', 'cape verde', 'ghana', 'czech republic', 'republica checa',
        'tunisia', 'túnez', 'ivory coast', 'costa de marfil', 'hungary', 'hungría',
        'cameroon', 'camerun', 'morocco', 'marruecos', 'uzbekistan', 'iran', 'irán',
        'wales', 'gales', 'congo', 'costa rica', 'finland', 'finlandia', 'israel',
        'senegal', 'guatemala', 'romania', 'rumanía', 'ireland', 'irlanda'
    ]):
        sections.append('Mundial 2026')

    # 2. Category & Season Classification
    is_retro = 'retro' in title_lower or any(yr in title_lower for yr in [
        '1970', '1974', '1978', '1982', '1986', '1988', '1990', '1992', '1994', '1996',
        '1998', '2000', '2002', '2004', '2006', '2008', '2010', '2012', '2014', '2016',
        '70/71', '74/75', '82/83', '84/85', '86/87', '88/89', '89/90', '90/91', '91/92',
        '92/93', '93/94', '94/95', '95/96', '96/97', '97/98', '98/99', '99/00', '00/01',
        '01/02', '02/03', '03/04', '04/05', '05/06', '06/07', '07/08', '08/09', '09/10',
        '10/11', '11/12', '12/13', '13/14', '14/15', '15/16', '16/17', '17/18', '18/19',
        '19/20', '20/21', '21/22', '22/23'
    ])

    if is_retro:
        category = 'Camiseta Retro'
        sections.append('Retro')
    elif any(w in title_lower for w in ['windbreaker', 'training pants', 'jacket', 'chándal', 'chandal', 'trench coat', 'sweatshirt', 'training suit', 'training wear', 'training kit', 'warm up', 'hoodie']):
        category = 'Cortavientos / Chándal'
        sections.append('Ropa Entrenamiento & Cortavientos')
    elif any(w in title_lower for w in ['t-shirt', 'polo', 'baseball', 'vest', 'crop', 'casual', 'streetwear']):
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
        sections.append('Temporada 26/27')

    # If product has season 26/27 in title, also ensure Temporada 26/27 is in sections
    if '26/27' in title_lower and 'Temporada 26/27' not in sections:
        sections.append('Temporada 26/27')
    if '25/26' in title_lower and 'Temporada 25/26' not in sections:
        sections.append('Temporada 25/26')

    # Deduplicate while preserving order
    dedup = []
    for s in sections:
        if s != 'Populares' and s not in dedup:
            dedup.append(s)

    primary = dedup[0] if dedup else 'Temporada 26/27'
    return primary, dedup, category

def extract_team(title):
    t = title.split('26/27')[0].split('25/26')[0].split('24/25')[0].split('Retro')[0]
    t = re.sub(r'\b(Player|Version|Home|Away|Third|Special|Edition|Kids|Kit|Training|Pants|Windbreaker|POLO|T-Shirt|Jersey|Size|S-XXL|S-3XL|S-4XL|S-5XL|16-28)\b', '', t, flags=re.IGNORECASE)
    t = t.strip(' -_')
    return t if t else 'Fútbol'

def process_all_csvs():
    csv_files = sorted(glob.glob('data/supplier_part*.csv'))
    print(f"Found CSV files: {csv_files}")
    
    products = []
    seen_urls = set()
    
    # Also load existing products.json if it has user created custom products!
    existing_products_path = 'data/products.json'
    existing_custom = []
    if os.path.exists(existing_products_path):
        try:
            with open(existing_products_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if content.strip():
                    loaded = json.loads(content)
                    if isinstance(loaded, list):
                        for p in loaded:
                            if not p.get('id', '').startswith('prod_kang_'):
                                existing_custom.append(p)
        except Exception as e:
            print("Error loading existing products:", e)
    
    print(f"Preserving {len(existing_custom)} custom user products already in products.json")

    for file_path in csv_files:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f, delimiter=';')
            headers = next(reader, None)
            for row in reader:
                if not row or len(row) < 3:
                    continue
                
                if len(row) >= 4:
                    supplier_team, title, url, image_url = row[0].strip(), row[1].strip(), row[2].strip(), row[3].strip()
                elif len(row) == 3:
                    supplier_team, title, url = row[0].strip(), row[1].strip(), row[2].strip()
                    image_url = ""
                else:
                    continue

                if not title or not url or title.lower() == 'titulo' or url.lower() == 'enlace_yupoo':
                    continue

                if url in seen_urls:
                    continue
                seen_urls.add(url)

                primary_section, sections, category = determine_section_and_category(title, url)
                team = extract_team(title)
                sizes = extract_sizes(title)
                prod_id = generate_id(title, url)

                is_retro = 'Retro' in sections or category == 'Camiseta Retro'
                is_player = 'player version' in title.lower()
                is_kids = 'kids' in title.lower() or '16-28' in title.lower()
                is_windbreaker = 'windbreaker' in title.lower() or 'jacket' in title.lower() or 'trench coat' in title.lower()
                is_pants = 'pants' in title.lower()

                price = 14.99
                cost_price = 8.00

                editions = []
                if is_player:
                    editions = ['PLAYER VERSION']
                elif not is_kids and not is_windbreaker and not is_pants:
                    editions = ['FAN VERSION', 'PLAYER VERSION']
                else:
                    editions = ['FAN VERSION']

                product = {
                    "id": prod_id,
                    "title": title,
                    "section": primary_section,
                    "sections": sections,
                    "category": category,
                    "supplierName": "Catálogo Oficial",
                    "price": price,
                    "costPrice": cost_price,
                    "url": url,
                    "provider": "Yupoo",
                    "imageUrl": image_url,
                    "images": [image_url] if image_url else [],
                    "team": team,
                    "season": "26/27" if "26/27" in title else ("25/26" if "25/26" in title else ("Retro" if is_retro else "26/27")),
                    "allowCustomDorsal": not is_pants and not is_windbreaker,
                    "availableEditions": editions,
                    "playerVersionExtraPrice": 0.0,
                    "dorsalExtraPrice": 4.0,
                    "isRetro": is_retro,
                    "isStoreItem": True,
                    "isPopular": False,
                    "availableSizes": sizes,
                    "qualityGrade": "",
                    "dateAdded": "2026-09-22"
                }
                products.append(product)

    # Clean existing custom items as well to ensure 14.99 and no Populares
    for p in existing_custom:
        p['price'] = 14.99
        p['isPopular'] = False
        if 'sections' in p and isinstance(p['sections'], list):
            p['sections'] = [s for s in p['sections'] if s != 'Populares']
        if p.get('section') == 'Populares':
            p['section'] = p['sections'][0] if p.get('sections') else 'Temporada 26/27'

    all_products = existing_custom + products
    print(f"Total products to write: {len(all_products)} ({len(existing_custom)} custom + {len(products)} from supplier)")

    with open('data/products.json', 'w', encoding='utf-8') as f:
        json.dump(all_products, f, indent=2, ensure_ascii=False)
    
    print("Successfully wrote data/products.json!")

    with open('src/data/initialProducts.ts', 'w', encoding='utf-8') as f:
        f.write("import { Product } from '../types';\n\n")
        f.write("export const INITIAL_PRODUCTS: Product[] = ")
        json.dump(all_products, f, indent=2, ensure_ascii=False)
        f.write(";\n")

    print("Successfully wrote src/data/initialProducts.ts!")

if __name__ == '__main__':
    process_all_csvs()
