#!/usr/bin/env node
/**
 * Script para importar camisetas desde archivos CSV locales a la tienda en lotes de 10 en 10.
 * Compatible con Node.js 18+ (utiliza ESM y fetch nativo).
 *
 * Prioridad de categorización:
 *   1. Valor de la columna 'Equipo_Categoria' (o 'Categoria' / 'Section') del CSV.
 *   2. Parámetro --section o --category en la terminal.
 *   3. Nombre del archivo CSV (ej: Japon.csv, MLS.csv, LaLiga.csv, Retro.csv).
 *   4. ID de categoría de Yupoo (referrercate=...) del enlace del proveedor.
 *   5. Análisis del título con límites de palabras (para evitar falsos positivos).
 *
 * Uso:
 *     node import_csv_batches.js mi_archivo.csv
 *     node import_csv_batches.js mi_archivo.csv --section "Japon League"
 *     node import_csv_batches.js mi_archivo.csv --url https://ais-dev-f54rsf7fcn7734dhjurte3-230473958320.europe-west2.run.app --batch-size 10
 */

import fs from 'fs';
import readline from 'readline';
import path from 'path';

const DEFAULT_API_URL = 'https://ais-dev-f54rsf7fcn7734dhjurte3-230473958320.europe-west2.run.app';

const CATALOG_SECTIONS = [
  'LaLiga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1',
  'Liga Profesional ARG', 'MLS', 'Primeira Liga', 'Eredivisie',
  'Japon League', 'Liga MX', 'Mundial 2026', 'Liga Escocesa',
  'Temporada 26/27', 'Temporada 25/26', 'Retro',
  'Conjuntos Especiales', 'Ropa Entrenamiento & Cortavientos', 'Ropa de Moda'
];

const REFERRERCATE_TO_SECTION = {
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
};

function resolveSection(categoryRaw, title, supplierUrl, filename = '', forcedSection = '') {
  const c = String(categoryRaw || '').trim();
  const cLower = c.toLowerCase();
  const t = String(title || '').trim();
  const tLower = t.toLowerCase();
  const fn = String(filename || '').toLowerCase();
  const u = String(supplierUrl || '').trim();

  // 1. Sección forzada por CLI
  if (forcedSection) {
    const match = CATALOG_SECTIONS.find(s => s.toLowerCase() === forcedSection.trim().toLowerCase());
    return match || forcedSection;
  }

  // 2. PRIORIDAD 1: Equipo_Categoria
  if (c) {
    const exact = CATALOG_SECTIONS.find(s => s.toLowerCase() === cLower);
    if (exact) return exact;

    if (!['kang team', 'team official', 'store', 'official supplier'].some(gen => cLower.includes(gen))) {
      if (/laliga|la liga|española|espanola/.test(cLower)) return 'LaLiga';
      if (/premier|epl|inglaterra|inglesa/.test(cLower)) return 'Premier League';
      if (/serie a|serie_a|italia|italiana|calcio/.test(cLower)) return 'Serie A';
      if (/bundesliga|alemana|alemania/.test(cLower)) return 'Bundesliga';
      if (/ligue 1|ligue1|francesa|francia/.test(cLower)) return 'Ligue 1';
      if (/japon|japan|j-league|jleague|j1|j2/.test(cLower)) return 'Japon League';
      if (/mls|estados unidos|usa/.test(cLower)) return 'MLS';
      if (/liga mx|ligamx|mexico|méxico|mexicana/.test(cLower)) return 'Liga MX';
      if (/primeira|portugal|portuguesa/.test(cLower)) return 'Primeira Liga';
      if (/eredivisie|holanda|holandesa|netherlands/.test(cLower)) return 'Eredivisie';
      if (/escocia|escocesa|scottish/.test(cLower)) return 'Liga Escocesa';
      if (/argentina|brasil|sudamerica|conmebol/.test(cLower)) return 'Liga Profesional ARG';
      if (/mundial|world cup|selecciones|nacionales/.test(cLower)) return 'Mundial 2026';
      if (/retro|vintage|classic/.test(cLower)) return 'Retro';
      if (/entrenamiento|training|chandal|cortavientos/.test(cLower)) return 'Ropa Entrenamiento & Cortavientos';
      if (/conjunto|kids|nino|niño/.test(cLower)) return 'Conjuntos Especiales';
    }
  }

  // 3. PRIORIDAD 2: Nombre de archivo
  if (fn) {
    const base = path.basename(fn);
    const match = CATALOG_SECTIONS.find(s => base.includes(s.toLowerCase()));
    if (match) return match;
    if (/japon|japan/.test(base)) return 'Japon League';
    if (/mls/.test(base)) return 'MLS';
    if (/laliga|liga_es/.test(base)) return 'LaLiga';
    if (/premier/.test(base)) return 'Premier League';
    if (/serie_a|seriea|serie a/.test(base)) return 'Serie A';
    if (/bundesliga/.test(base)) return 'Bundesliga';
    if (/ligue1|ligue_1|ligue 1/.test(base)) return 'Ligue 1';
    if (/mexico|mx/.test(base)) return 'Liga MX';
    if (/escocia|scottish/.test(base)) return 'Liga Escocesa';
    if (/portugal|primeira/.test(base)) return 'Primeira Liga';
    if (/holanda|eredivisie/.test(base)) return 'Eredivisie';
    if (/mundial|worldcup/.test(base)) return 'Mundial 2026';
    if (/retro/.test(base)) return 'Retro';
  }

  // 4. PRIORIDAD 3: Yupoo referrercate
  const m = u.match(/referrercate=(\d+)/);
  if (m && REFERRERCATE_TO_SECTION[m[1]]) {
    return REFERRERCATE_TO_SECTION[m[1]];
  }

  // 5. PRIORIDAD 4: Tipo de prenda evidente en título
  if (/\b(training|chandal|chándal|pants|pantalon|pantalón|tracksuit|windbreaker|cortaviento|jacket|trench coat)\b/.test(tLower)) {
    return 'Ropa Entrenamiento & Cortavientos';
  }
  if (/\b(kids kit|kid kit|conjunto nino|conjunto niño)\b/.test(tLower)) {
    return 'Conjuntos Especiales';
  }

  if (m && m[1] === '680738') {
    return /\b(palmeiras|flamengo|corinthians|sao paulo|santos|gremio|fluminense|botafogo|cruzeiro|vasco)\b/.test(tLower)
      ? 'Liga Profesional ARG'
      : 'Serie A';
  }

  if (m && m[1] === '680717') {
    return 'LaLiga';
  }

  // 6. PRIORIDAD 5: Detección por equipo con límites de palabra \b
  if (/\b(japan|japon|yokohama|vissel|kobe|shimizu|sanfrecce|grampus|sanga|frontale|reysol|antlers|gamba|cerezo|tokyo|fukuoka|yakos|urawa|consadole)\b/.test(tLower)) return 'Japon League';
  if (/\b(miami|galaxy|lafc|chicago fire|sounders|timbers|columbus|austin fc|nycfc|red bulls|mls)\b/.test(tLower)) return 'MLS';
  if (/\b(america|chivas|cruz azul|tigres|monterrey|pumas|toluca|santos laguna|pachuca|atlas|leon|puebla|tijuana|mazatlan|necaxa|juarez|atlante)\b/.test(tLower)) return 'Liga MX';
  if (/\b(rangers|celtic|celtics|aberdeen|hearts|hibernian)\b/.test(tLower)) return 'Liga Escocesa';
  if (/\b(benfica|sporting lisbon|sporting cp|porto|famalicao|braga|boavista|guimaraes|rio ave)\b/.test(tLower)) return 'Primeira Liga';
  if (/\b(ajax|feyenoord|psv|alkmaar)\b/.test(tLower)) return 'Eredivisie';
  if (/\b(psg|paris|marseille|monaco|lyon|rennais|rennes|lille|losc|lens|nantes|strasbourg|toulouse|reims|brest|ligue 1)\b/.test(tLower)) return 'Ligue 1';
  if (/\b(juventus|milan|inter|roma|napoli|lazio|fiorentina|atalanta|torino|bologna|genoa|parma|como|monza|udinese|cagliari|verona|empoli|lecce|venezia|serie a)\b/.test(tLower)) return 'Serie A';
  if (/\b(liverpool|arsenal|chelsea|tottenham|spurs|aston villa|villa|newcastle|west ham|westham|everton|brighton|wolves|wolverhampton|fulham|crystal palace|brentford|nottingham|leicester|ipswich|southampton|bournemouth|wrexham|manchester|premier)\b/.test(tLower)) return 'Premier League';
  if (/\b(bayern|dortmund|bvb|leverkusen|leipzig|frankfurt|stuttgart|wolfsburg|gladbach|freiburg|augsburg|mainz|hoffenheim|heidenheim|bochum|union berlin|werder|bundesliga)\b/.test(tLower)) return 'Bundesliga';
  if (/\b(boca|river|racing|independiente|san lorenzo|velez|vélez|estudiantes|newells|rosario|argentinos juniors|palmeiras|flamengo|corinthians|sao paulo|santos|gremio|colo colo|universidad de chile|universidad católica|penarol|nacional)\b/.test(tLower)) return 'Liga Profesional ARG';
  if (/\b(spain|españa|argentina|brazil|brasil|france|francia|england|inglaterra|germany|alemania|portugal|italy|italia|netherlands|holanda|belgium|belgica|uruguay|colombia|croatia|croacia|morocco|marruecos|usa)\b/.test(tLower)) return 'Mundial 2026';
  if (/\b(madrid|barcelona|barça|atletico|atlético|betis|sevilla|athletic|valencia|villarreal|sociedad|celta|osasuna|mallorca|getafe|rayo|espanyol|girona|alaves|las palmas|leganes|valladolid|laliga)\b/.test(tLower)) return 'LaLiga';
  if (/retro|classic|198|199|9\d\/\d\d|0\d\/\d\d/.test(tLower)) return 'Retro';

  if (/26\/27|2026\/27/.test(tLower)) return 'Temporada 26/27';
  if (/25\/26|2025\/26/.test(tLower)) return 'Temporada 25/26';

  return 'Temporada 26/27';
}

function parseSizes(title) {
  const t = title.toUpperCase();
  if (t.includes('S-4XL')) return ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
  if (t.includes('S-3XL') || t.includes('S-XXXL')) return ['S', 'M', 'L', 'XL', '2XL', '3XL'];
  return ['S', 'M', 'L', 'XL', '2XL'];
}

function calculatePrices(title, section) {
  const t = title.toLowerCase();

  // 1. Abrigos (Coats / Jackets / Trench / Parka / Windbreaker / Hoodie)
  const isCoat = /abrigo|coat|trench|jacket|windbreaker|parka|anorak|down jacket|hoodie|hooded/.test(t);
  if (isCoat) {
    if (t.includes('reversible')) {
      return { price: 39.99, costPrice: 18.00, originalPrice: 59.99 }; // Abrigo reversible: 39.99 €
    }
    if (/hood|capucha|hooded|hoodie/.test(t)) {
      return { price: 36.99, costPrice: 16.00, originalPrice: 54.99 }; // Abrigo con capucha: 36.99 €
    }
    return { price: 33.99, costPrice: 14.50, originalPrice: 49.99 }; // Abrigo normal: 33.99 €
  }

  // 2. Camisetas Retro (19.99 €)
  const isRetro = section === 'Retro' || /retro|classic|198|199|9\d\/\d\d|0\d\/\d\d/.test(t);
  if (isRetro) {
    return { price: 19.99, costPrice: 8.50, originalPrice: 29.99 };
  }

  // 3. Player version
  if (/player|jugador/.test(t)) {
    return { price: 28.99, costPrice: 11.50, originalPrice: 35.00 };
  }

  // 4. Estándar
  return { price: 24.99, costPrice: 9.50, originalPrice: 30.00 };
}

function splitRow(line, delimiter) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      fields.push(field.trim());
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field.trim());
  return fields;
}

async function sendBatch(apiUrl, batch, adminKey = 't.il]?YDY^dC5EC^') {
  const endpoint = `${apiUrl.replace(/\/$/, '')}/api/products/batch`;
  const headers = { 'Content-Type': 'application/json' };
  if (adminKey) {
    headers['x-admin-key'] = adminKey;
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ products: batch, adminKey })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error HTTP ${res.status}: ${errText}`);
  }
  return await res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const csvFile = args.find(a => !a.startsWith('--'));

  if (!csvFile || !fs.existsSync(csvFile)) {
    console.error(`❌ Debes especificar un archivo CSV válido. Ejemplo: node import_csv_batches.js mis_camisetas.csv`);
    process.exit(1);
  }

  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  const apiUrl = getArg('--url') || DEFAULT_API_URL;
  const forcedSection = getArg('--section') || getArg('--category') || '';
  const batchSize = parseInt(getArg('--batch-size') || '10', 10);
  const delay = parseFloat(getArg('--delay') || '0.2');
  const adminKey = getArg('--admin-key') || getArg('--admin-pin') || getArg('--key') || 't.il]?YDY^dC5EC^';

  console.log('\n' + '='.repeat(60));
  console.log('🚀 IMPORTADOR DE CAMISETAS EN LOTES DE 10 (Node.js)');
  console.log(`📁 Archivo:       ${csvFile}`);
  if (forcedSection) console.log(`🏷️  Sección fija:  ${forcedSection}`);
  console.log(`🌐 Destino API:   ${apiUrl}/api/products/batch`);
  console.log(`📦 Tamaño lote:   ${batchSize} camisetas`);
  if (adminKey) {
    const masked = adminKey.length > 6 ? adminKey.slice(0, 3) + '...' + adminKey.slice(-3) : '***';
    console.log(`🔑 Clave Admin:   ${masked} (autenticado)`);
  }
  console.log('='.repeat(60) + '\n');

  const fileStream = fs.createReadStream(csvFile, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let delimiter = ';';
  let headers = null;
  let queue = [];
  let totalProcessed = 0;
  let batchIndex = 0;
  let totalAdded = 0;
  let totalUpdated = 0;
  let storeTotal = 0;

  for await (const rawLine of rl) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('sep=')) {
      delimiter = line.split('=')[1] || ';';
      continue;
    }

    if (!headers) {
      if (line.includes(',') && !line.includes(';')) delimiter = ',';
      else if (line.includes('\t')) delimiter = '\t';
      headers = splitRow(line, delimiter).map(h => h.replace(/^["']|["']$/g, ''));
      continue;
    }

    const rowValues = splitRow(line, delimiter);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = rowValues[i] || '';
    });

    const title = (row.Titulo || row.titulo || row.Title || row.title || row.Nombre || '').replace(/^["']|["']$/g, '').trim();
    if (!title) continue;

    const supplierUrl = (row.Enlace_Yupoo || row.enlace_yupoo || row.Yupoo || row.URL || '').trim();
    const imageUrl = (row.Imagen_URL || row.imagen_url || row.Foto || '').trim();
    const categoryField = (row.Equipo_Categoria || row.equipo_categoria || row.Categoria || row.Section || '').trim();

    const primarySection = resolveSection(categoryField, title, supplierUrl, csvFile, forcedSection);
    const { price, costPrice, originalPrice } = calculatePrices(title, primarySection);

    const sections = [primarySection];
    if (title.includes('26/27')) sections.push('Temporada 26/27');
    if (title.includes('25/26')) sections.push('Temporada 25/26');
    if (/retro|classic/i.test(title)) sections.push('Retro');

    const isRetroItem = primarySection === 'Retro' || sections.includes('Retro') || /retro|classic/i.test(title);

    queue.push({
      title,
      price,
      originalPrice,
      costPrice,
      section: primarySection,
      sections: [...new Set(sections)],
      team: title.split(' ')[0],
      imageUrl,
      images: imageUrl ? [imageUrl] : [],
      availableEditions: isRetroItem ? ['FAN VERSION'] : ['FAN VERSION', 'PLAYER VERSION'],
      sizes: parseSizes(title),
      inStock: true,
      supplierUrl,
      notes: `Importado de ${categoryField || 'Yupoo'} (${primarySection})`
    });

    totalProcessed++;

    if (queue.length >= batchSize) {
      batchIndex++;
      const toSend = [...queue];
      queue = [];
      try {
        const res = await sendBatch(apiUrl, toSend, adminKey);
        totalAdded += (res.added || 0);
        totalUpdated += (res.updated || 0);
        storeTotal = res.totalProductsInStore || storeTotal;
        console.log(`  ✅ Lote ${String(batchIndex).padStart(3, '0')}: ${toSend.length} camisetas -> +${res.added || 0} nuevas, ${res.updated || 0} actualizadas (Total en web: ${storeTotal})`);
      } catch (err) {
        console.error(`  ❌ Error en lote ${batchIndex}:`, err.message);
      }
      if (delay > 0) await new Promise(r => setTimeout(r, delay * 1000));
    }
  }

  if (queue.length > 0) {
    batchIndex++;
    try {
      const res = await sendBatch(apiUrl, queue, adminKey);
      totalAdded += (res.added || 0);
      totalUpdated += (res.updated || 0);
      storeTotal = res.totalProductsInStore || storeTotal;
      console.log(`  ✅ Lote final ${String(batchIndex).padStart(3, '0')}: ${queue.length} camisetas -> +${res.added || 0} nuevas, ${res.updated || 0} actualizadas (Total en web: ${storeTotal})`);
    } catch (err) {
      console.error(`  ❌ Error en lote final:`, err.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 IMPORTACIÓN COMPLETADA');
  console.log(`  • Total leídas del CSV: ${totalProcessed}`);
  console.log(`  • Lotes enviados:       ${batchIndex}`);
  console.log(`  • Nuevas añadidas:      ${totalAdded}`);
  console.log(`  • Actualizadas:         ${totalUpdated}`);
  console.log(`  • Total en la tienda:   ${storeTotal}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
