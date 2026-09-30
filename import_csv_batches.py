#!/usr/bin/env python3
"""
Script para importar camisetas desde archivos CSV locales a la tienda en lotes de 10 en 10.
Compatible con Python 3.7+ (utiliza solo librerías estándar: urllib, json, csv, re, sys, argparse, os).

Prioridad de categorización:
  1. Valor de la columna 'Equipo_Categoria' (o 'Categoria' / 'Section') del CSV.
  2. Parámetro --section / --category si se especificó en la terminal.
  3. Nombre del archivo CSV (ej: Japon.csv, MLS.csv, LaLiga.csv, Retro.csv).
  4. ID de categoría de Yupoo (referrercate=...) del enlace del proveedor.
  5. Análisis del título con límites de palabras (para evitar falsos positivos).

Uso:
    python import_csv_batches.py mi_archivo.csv
    python import_csv_batches.py mi_archivo.csv --section "Japon League"
    python import_csv_batches.py mi_archivo.csv --url https://ais-dev-f54rsf7fcn7734dhjurte3-230473958320.europe-west2.run.app --batch-size 10
"""

import sys
import os
import csv
import re
import json
import time
import argparse
import urllib.request
import urllib.error

DEFAULT_API_URL = "https://ais-dev-f54rsf7fcn7734dhjurte3-230473958320.europe-west2.run.app"

CATALOG_SECTIONS = [
    'LaLiga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Liga Profesional ARG', 'MLS', 'Primeira Liga', 'Eredivisie',
    'Japon League', 'Liga MX', 'Mundial 2026', 'Liga Escocesa',
    'Temporada 26/27', 'Temporada 25/26', 'Retro',
    'Conjuntos Especiales', 'Ropa Entrenamiento & Cortavientos', 'Ropa de Moda'
]

REFERRERCATE_TO_SECTION = {
    '2827820': 'Japon League',
    '3247384': 'MLS',
    '3302917': 'Liga MX',
    '3302977': 'Primeira Liga',
    '680719': 'Liga Escocesa',
    '5062328': 'Mundial 2026',
    '5211803': 'Mundial 2026',
    '2897018': 'Ligue 1',
    '3703045': 'Liga Profesional ARG',
    '3302915': 'Liga Profesional ARG',
    '680725': 'Ropa Entrenamiento & Cortavientos',
}

def resolve_section(category_raw: str, title: str, supplier_url: str, filename: str = "", forced_section: str = ""):
    """
    Determina la categoría/sección principal con prioridad estricta:
    1. forced_section si el usuario la indicó explícitamente en la llamada.
    2. Columna Equipo_Categoria del CSV.
    3. Nombre del archivo CSV.
    4. Categoría referrercate de Yupoo.
    5. Adivinanza por título sólo si las anteriores están vacías.
    """
    c = str(category_raw or '').strip()
    c_lower = c.lower()
    t = str(title or '').strip()
    t_lower = t.lower()
    fn = str(filename or '').strip().lower()
    u = str(supplier_url or '').strip()

    # 1. Si el usuario forzó una sección por CLI
    if forced_section:
        for s in CATALOG_SECTIONS:
            if s.lower() == forced_section.strip().lower():
                return s
        return forced_section

    # 2. PRIORIDAD 1: Campo Equipo_Categoria del CSV
    if c:
        # Coincidencia exacta con alguna sección del catálogo
        for s in CATALOG_SECTIONS:
            if s.lower() == c_lower:
                return s

        # Mapeos de palabras clave de Equipo_Categoria
        # (ignorando nombres genéricos de tienda como KANG)
        if not any(gen in c_lower for gen in ['kang team', 'team official', 'store', 'official supplier']):
            if any(k in c_lower for k in ['laliga', 'la liga', 'española', 'espanola']): return 'LaLiga'
            if any(k in c_lower for k in ['premier', 'epl', 'inglaterra', 'inglesa']): return 'Premier League'
            if any(k in c_lower for k in ['serie a', 'serie_a', 'italia', 'italiana', 'calcio']): return 'Serie A'
            if any(k in c_lower for k in ['bundesliga', 'alemana', 'alemania']): return 'Bundesliga'
            if any(k in c_lower for k in ['ligue 1', 'ligue1', 'francesa', 'francia']): return 'Ligue 1'
            if any(k in c_lower for k in ['japon', 'japan', 'j-league', 'jleague', 'j1', 'j2']): return 'Japon League'
            if any(k in c_lower for k in ['mls', 'estados unidos', 'usa']): return 'MLS'
            if any(k in c_lower for k in ['liga mx', 'ligamx', 'mexico', 'méxico', 'mexicana']): return 'Liga MX'
            if any(k in c_lower for k in ['primeira', 'portugal', 'portuguesa']): return 'Primeira Liga'
            if any(k in c_lower for k in ['eredivisie', 'holanda', 'holandesa', 'netherlands']): return 'Eredivisie'
            if any(k in c_lower for k in ['escocia', 'escocesa', 'scottish']): return 'Liga Escocesa'
            if any(k in c_lower for k in ['argentina', 'brasil', 'sudamerica', 'conmebol']): return 'Liga Profesional ARG'
            if any(k in c_lower for k in ['mundial', 'world cup', 'selecciones', 'nacionales']): return 'Mundial 2026'
            if any(k in c_lower for k in ['retro', 'vintage', 'classic']): return 'Retro'
            if any(k in c_lower for k in ['entrenamiento', 'training', 'chandal', 'cortavientos']): return 'Ropa Entrenamiento & Cortavientos'
            if any(k in c_lower for k in ['conjunto', 'kids', 'nino', 'niño']): return 'Conjuntos Especiales'

    # 3. PRIORIDAD 2: Nombre del archivo CSV cargado
    if fn:
        base_fn = os.path.basename(fn)
        for s in CATALOG_SECTIONS:
            if s.lower() in base_fn:
                return s
        if any(k in base_fn for k in ['japon', 'japan']): return 'Japon League'
        if any(k in base_fn for k in ['mls']): return 'MLS'
        if any(k in base_fn for k in ['laliga', 'liga_es']): return 'LaLiga'
        if any(k in base_fn for k in ['premier']): return 'Premier League'
        if any(k in base_fn for k in ['serie_a', 'seriea', 'serie a']): return 'Serie A'
        if any(k in base_fn for k in ['bundesliga']): return 'Bundesliga'
        if any(k in base_fn for k in ['ligue1', 'ligue_1', 'ligue 1']): return 'Ligue 1'
        if any(k in base_fn for k in ['mexico', 'mx']): return 'Liga MX'
        if any(k in base_fn for k in ['escocia', 'scottish']): return 'Liga Escocesa'
        if any(k in base_fn for k in ['portugal', 'primeira']): return 'Primeira Liga'
        if any(k in base_fn for k in ['holanda', 'eredivisie']): return 'Eredivisie'
        if any(k in base_fn for k in ['mundial', 'worldcup']): return 'Mundial 2026'
        if any(k in base_fn for k in ['retro']): return 'Retro'
        if any(k in base_fn for k in ['entrenamiento', 'training']): return 'Ropa Entrenamiento & Cortavientos'

    # 4. PRIORIDAD 3: Categoría en supplierUrl de Yupoo
    m = re.search(r'referrercate=(\d+)', u)
    if m and m.group(1) in REFERRERCATE_TO_SECTION:
        return REFERRERCATE_TO_SECTION[m.group(1)]

    # 5. PRIORIDAD 4: Tipo de prenda evidente en el título
    if any(k in t_lower for k in ['training', 'chandal', 'chándal', 'pants', 'pantalon', 'pantalón', 'tracksuit', 'windbreaker', 'cortaviento', 'jacket', 'trench coat', 'hoodie']):
        return 'Ropa Entrenamiento & Cortavientos'
    if any(k in t_lower for k in ['kids kit', 'kid kit', 'conjunto nino', 'conjunto niño', 'baby kit']):
        return 'Conjuntos Especiales'

    if m and m.group(1) == '680738':
        if any(k in t_lower for k in ['palmeiras', 'flamengo', 'corinthians', 'sao paulo', 'santos', 'gremio', 'fluminense', 'botafogo', 'cruzeiro', 'vasco']):
            return 'Liga Profesional ARG'
        return 'Serie A'

    if m and m.group(1) == '680717':
        return 'LaLiga'

    # 6. PRIORIDAD 5: Detección por equipo en título (usando límites de palabra \b para evitar falsos positivos)
    if re.search(r'\b(japan|japon|yokohama|vissel|kobe|shimizu|sanfrecce|grampus|sanga|frontale|reysol|antlers|gamba|cerezo|tokyo|fukuoka|yakos|urawa|consadole)\b', t_lower):
        return 'Japon League'

    if re.search(r'\b(miami|galaxy|lafc|chicago fire|sounders|timbers|columbus|austin fc|nycfc|red bulls|mls)\b', t_lower):
        return 'MLS'

    if re.search(r'\b(america|chivas|cruz azul|tigres|monterrey|pumas|toluca|santos laguna|pachuca|atlas|leon|puebla|tijuana|mazatlan|necaxa|juarez|atlante)\b', t_lower):
        return 'Liga MX'

    if re.search(r'\b(rangers|celtic|celtics|aberdeen|hearts|hibernian)\b', t_lower):
        return 'Liga Escocesa'

    if re.search(r'\b(benfica|sporting lisbon|sporting cp|porto|famalicao|braga|boavista|guimaraes|rio ave)\b', t_lower):
        return 'Primeira Liga'

    if re.search(r'\b(ajax|feyenoord|psv|alkmaar)\b', t_lower):
        return 'Eredivisie'

    if re.search(r'\b(psg|paris|marseille|monaco|lyon|rennais|rennes|lille|losc|lens|nantes|strasbourg|toulouse|reims|brest|ligue 1)\b', t_lower):
        return 'Ligue 1'

    if re.search(r'\b(juventus|milan|inter|roma|napoli|lazio|fiorentina|atalanta|torino|bologna|genoa|parma|como|monza|udinese|cagliari|verona|empoli|lecce|venezia|serie a)\b', t_lower):
        return 'Serie A'

    if re.search(r'\b(liverpool|arsenal|chelsea|tottenham|spurs|aston villa|villa|newcastle|west ham|westham|everton|brighton|wolves|wolverhampton|fulham|crystal palace|brentford|nottingham|leicester|ipswich|southampton|bournemouth|wrexham|manchester|premier)\b', t_lower):
        return 'Premier League'

    if re.search(r'\b(bayern|dortmund|bvb|leverkusen|leipzig|frankfurt|stuttgart|wolfsburg|gladbach|freiburg|augsburg|mainz|hoffenheim|heidenheim|bochum|union berlin|werder|bundesliga)\b', t_lower):
        return 'Bundesliga'

    if re.search(r'\b(boca|river|racing|independiente|san lorenzo|velez|vélez|estudiantes|newells|rosario|argentinos juniors|palmeiras|flamengo|corinthians|sao paulo|santos|gremio|colo colo|universidad de chile|universidad católica|penarol|nacional)\b', t_lower):
        return 'Liga Profesional ARG'

    if re.search(r'\b(spain|españa|argentina|brazil|brasil|france|francia|england|inglaterra|germany|alemania|portugal|italy|italia|netherlands|holanda|belgium|belgica|uruguay|colombia|croatia|croacia|morocco|marruecos|usa)\b', t_lower):
        return 'Mundial 2026'

    if re.search(r'\b(madrid|barcelona|barça|atletico|atlético|betis|sevilla|athletic|valencia|villarreal|sociedad|celta|osasuna|mallorca|getafe|rayo|espanyol|girona|alaves|las palmas|leganes|valladolid|laliga)\b', t_lower):
        return 'LaLiga'

    if any(k in t_lower for k in ['retro', 'classic', '198', '199', '90/91', '91/92', '92/93', '93/94', '94/95', '95/96', '96/97', '97/98', '98/99', '99/00', '00/01', '01/02', '02/03', '03/04', '04/05']):
        return 'Retro'

    if any(yr in t_lower for yr in ['26/27', '2026/27', '2026/2027']):
        return 'Temporada 26/27'
    if any(yr in t_lower for yr in ['25/26', '2025/26']):
        return 'Temporada 25/26'

    return 'Temporada 26/27'

def build_sections_list(primary_section: str, title: str):
    """Construye la lista completa de secciones secundarias."""
    t = title.lower()
    sections = [primary_section]

    if any(yr in t for yr in ['26/27', '2026/27', '2026/2027', '2027']):
        sections.append('Temporada 26/27')
    if any(yr in t for yr in ['25/26', '2025/26', '2025/2026']):
        sections.append('Temporada 25/26')

    is_retro = any(kw in t for kw in [
        'retro', 'classic', '198', '199', '90/91', '91/92', '92/93', '93/94',
        '94/95', '95/96', '96/97', '97/98', '98/99', '99/00', '00/01', '01/02',
        '02/03', '03/04', '04/05', '05/06', '06/07', '07/08'
    ])
    if is_retro:
        sections.append('Retro')

    if any(kw in t for kw in ['training', 'chandal', 'chándal', 'pants', 'pantalon', 'cortaviento', 'windbreaker']):
        sections.append('Ropa Entrenamiento & Cortavientos')

    return list(dict.fromkeys(sections))

def parse_sizes(title: str):
    t = title.upper()
    if 'S-4XL' in t: return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
    if 'S-3XL' in t or 'S-XXXL' in t: return ['S', 'M', 'L', 'XL', '2XL', '3XL']
    if 'S-XXL' in t or 'S-2XL' in t: return ['S', 'M', 'L', 'XL', '2XL']
    return ['S', 'M', 'L', 'XL', '2XL']

def calculate_prices(title: str, primary_section: str):
    t = title.lower()

    # 1. Abrigos (Coats / Jackets / Trench / Parka / Windbreaker)
    is_coat = any(k in t for k in ['abrigo', 'coat', 'trench', 'jacket', 'windbreaker', 'parka', 'anorak', 'down jacket', 'hoodie', 'hooded'])
    if is_coat:
        if 'reversible' in t:
            return 39.99, 18.00, 59.99  # Abrigo reversible: 39.99 €
        elif any(k in t for k in ['hood', 'capucha', 'hooded', 'hoodie']):
            return 36.99, 16.00, 54.99  # Abrigo con capucha: 36.99 €
        else:
            return 33.99, 14.50, 49.99  # Abrigo normal: 33.99 €

    # 2. Camisetas Retro (19.99 €)
    is_retro = primary_section == 'Retro' or any(k in t for k in ['retro', 'classic', '198', '199', '90/91', '91/92', '92/93', '93/94', '94/95', '95/96', '96/97', '97/98', '98/99', '99/00', '00/01', '01/02', '02/03', '03/04', '04/05'])
    if is_retro:
        return 19.99, 8.50, 29.99

    # 3. Versión jugador
    if 'player' in t or 'jugador' in t:
        return 28.99, 11.50, 35.00

    # 4. Ediciones especiales
    if 'special' in t or 'anniversary' in t or 'saint seiya' in t:
        return 27.99, 10.50, 35.00

    # 5. Camisetas estándar
    return 24.99, 9.50, 30.00

def row_to_product(row_dict: dict, csv_filename: str = "", forced_section: str = ""):
    """Convierte una fila del CSV al formato de producto respetando la jerarquía de categorías."""
    title = (
        row_dict.get('Titulo') or
        row_dict.get('titulo') or
        row_dict.get('Title') or
        row_dict.get('title') or
        row_dict.get('Nombre') or
        ''
    ).strip()

    if not title:
        return None

    yupoo_link = (
        row_dict.get('Enlace_Yupoo') or
        row_dict.get('enlace_yupoo') or
        row_dict.get('Yupoo') or
        row_dict.get('yupoo') or
        row_dict.get('Album') or
        row_dict.get('URL') or
        ''
    ).strip()

    image_url = (
        row_dict.get('Imagen_URL') or
        row_dict.get('imagen_url') or
        row_dict.get('Image_URL') or
        row_dict.get('image_url') or
        row_dict.get('Imagen') or
        row_dict.get('Foto') or
        ''
    ).strip()

    category_field = (
        row_dict.get('Equipo_Categoria') or
        row_dict.get('equipo_categoria') or
        row_dict.get('Categoria') or
        row_dict.get('Category') or
        row_dict.get('Section') or
        ''
    ).strip()

    # Prioridad: 1. Equipo_Categoria / forced / filename -> 2. Yupoo -> 3. Title
    primary_section = resolve_section(
        category_raw=category_field,
        title=title,
        supplier_url=yupoo_link,
        filename=csv_filename,
        forced_section=forced_section
    )

    sections = build_sections_list(primary_section, title)
    sizes = parse_sizes(title)
    price, cost_price, original_price = calculate_prices(title, primary_section)

    cleaned_team = re.sub(
        r'\b(26/27|25/26|24/25|94/96|98/99|home|away|third|jersey|retro|s-4xl|s-xxl|s-3xl|s-xxxl|player|fan|edition|special|kit|shirt)\b',
        '',
        title,
        flags=re.IGNORECASE
    ).strip()
    team = cleaned_team if cleaned_team else title.split()[0]
    is_retro = primary_section == 'Retro' or 'Retro' in sections or any(k in title.lower() for k in ['retro', 'classic'])
    available_editions = ['FAN VERSION'] if is_retro else ['FAN VERSION', 'PLAYER VERSION']

    return {
        'title': title,
        'price': price,
        'originalPrice': original_price,
        'costPrice': cost_price,
        'section': primary_section,
        'sections': sections,
        'team': team,
        'season': '26/27' if '26/27' in title else ('25/26' if '25/26' in title else '2026'),
        'imageUrl': image_url,
        'images': [image_url] if image_url else [],
        'availableEditions': available_editions,
        'sizes': sizes,
        'inStock': True,
        'supplierUrl': yupoo_link,
        'notes': f'Importado de {category_field or "Yupoo"} ({primary_section})',
    }

def send_batch(api_base_url: str, batch: list, admin_key: str = "t.il]?YDY^dC5EC^"):
    endpoint = f"{api_base_url.rstrip('/')}/api/products/batch"
    payload_data = {"products": batch}
    if admin_key:
        payload_data["adminKey"] = admin_key
    payload = json.dumps(payload_data).encode("utf-8")

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "BatchCSVImporter/2.0",
    }
    if admin_key:
        headers["x-admin-key"] = admin_key

    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw_text = resp.read().decode("utf-8", errors="replace")
            return json.loads(raw_text)
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Error HTTP {e.code}: {err_msg}")
    except Exception as e:
        raise RuntimeError(f"Fallo de conexión: {e}")

def import_csv(file_path: str, api_url: str, batch_size: int = 10, delay: float = 0.2, forced_section: str = "", admin_key: str = "t.il]?YDY^dC5EC^"):
    if not os.path.exists(file_path):
        print(f"❌ Error: El archivo '{file_path}' no existe.")
        sys.exit(1)

    print("\n" + "="*60)
    print("🚀 IMPORTADOR DE CAMISETAS EN LOTES DE 10 (v2.0)")
    print(f"📁 Archivo:       {file_path}")
    if forced_section:
        print(f"🏷️  Sección fija:  {forced_section}")
    print(f"🌐 Destino API:   {api_url}/api/products/batch")
    print(f"📦 Tamaño lote:   {batch_size} camisetas por petición")
    if admin_key:
        masked_key = admin_key[:3] + "..." + admin_key[-3:] if len(admin_key) > 6 else "***"
        print(f"🔑 Clave Admin:   {masked_key} (autenticado)")
    print("="*60 + "\n")

    with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
        first_line = f.readline()
        delimiter = ";"
        if first_line.strip().startswith("sep="):
            delimiter = first_line.strip().split("=")[-1]
        elif "," in first_line and ";" not in first_line:
            delimiter = ","
        elif "\t" in first_line:
            delimiter = "\t"

    products_queue = []
    total_processed = 0
    total_batches_sent = 0
    total_added = 0
    total_updated = 0
    store_total = 0

    with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
        pos = f.tell()
        line = f.readline()
        if not line.strip().startswith("sep="):
            f.seek(pos)

        reader = csv.DictReader(f, delimiter=delimiter)

        for row in reader:
            product = row_to_product(row, csv_filename=file_path, forced_section=forced_section)
            if not product:
                continue

            products_queue.append(product)
            total_processed += 1

            if len(products_queue) >= batch_size:
                total_batches_sent += 1
                try:
                    res = send_batch(api_url, products_queue, admin_key=admin_key)
                    added = res.get("added", 0)
                    updated = res.get("updated", 0)
                    store_total = res.get("totalProductsInStore", 0)
                    total_added += added
                    total_updated += updated
                    print(f"  ✅ Lote {total_batches_sent:03d}: {len(products_queue)} camisetas -> +{added} nuevas, {updated} actualizadas (Total en web: {store_total})")
                except Exception as err:
                    print(f"  ⚠️ Error en Lote {total_batches_sent}: {err}")
                    print("     Reintentando en 2 segundos...")
                    time.sleep(2)
                    try:
                        res = send_batch(api_url, products_queue, admin_key=admin_key)
                        print(f"  ✅ Lote {total_batches_sent:03d} completado tras reintento.")
                    except Exception as err2:
                        print(f"  ❌ Fallo definitivo en lote {total_batches_sent}: {err2}")

                products_queue.clear()
                if delay > 0:
                    time.sleep(delay)

        if products_queue:
            total_batches_sent += 1
            try:
                res = send_batch(api_url, products_queue, admin_key=admin_key)
                added = res.get("added", 0)
                updated = res.get("updated", 0)
                store_total = res.get("totalProductsInStore", 0)
                total_added += added
                total_updated += updated
                print(f"  ✅ Lote final {total_batches_sent:03d}: {len(products_queue)} camisetas -> +{added} nuevas, {updated} actualizadas (Total en web: {store_total})")
            except Exception as err:
                print(f"  ❌ Error enviando lote final: {err}")

    print("\n" + "="*60)
    print("🎉 IMPORTACIÓN COMPLETADA CON ÉXITO")
    print(f"  • Total leídas del CSV: {total_processed}")
    print(f"  • Lotes enviados:       {total_batches_sent}")
    print(f"  • Nuevas añadidas:      {total_added}")
    print(f"  • Actualizadas:         {total_updated}")
    if store_total:
        print(f"  • Total en la tienda:   {store_total}")
    print("="*60 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importador de camisetas CSV en lotes de 10 a la tienda.")
    parser.add_argument("csv_file", help="Ruta al archivo CSV (ej: mis_camisetas.csv)")
    parser.add_argument("--url", default=DEFAULT_API_URL, help=f"URL base de la web (por defecto: {DEFAULT_API_URL})")
    parser.add_argument("--section", "--category", dest="forced_section", default="", help="Forzar una sección para todo el archivo (ej: 'Japon League', 'LaLiga', 'Retro')")
    parser.add_argument("--batch-size", type=int, default=10, help="Tamaño de cada lote (por defecto: 10)")
    parser.add_argument("--delay", type=float, default=0.2, help="Pausa en segundos entre lotes (por defecto: 0.2s)")
    parser.add_argument("--admin-key", "--admin-pin", "--key", dest="admin_key", default="t.il]?YDY^dC5EC^", help="Clave de administrador para autorizar la importación (ej: \"t.il]?YDY^dC5EC^\")")

    args = parser.parse_args()
    import_csv(args.csv_file, args.url, batch_size=args.batch_size, delay=args.delay, forced_section=args.forced_section, admin_key=args.admin_key)
