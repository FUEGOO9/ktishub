import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json');
const COUPONS_FILE = path.join(process.cwd(), 'data', 'coupons.json');

// Ensure data directory and files exist
try {
  if (!fs.existsSync(path.dirname(PRODUCTS_FILE))) {
    fs.mkdirSync(path.dirname(PRODUCTS_FILE), { recursive: true });
  }
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([]), 'utf-8');
  }
  if (!fs.existsSync(COUPONS_FILE)) {
    fs.writeFileSync(COUPONS_FILE, JSON.stringify([]), 'utf-8');
  }
} catch (e) {
  console.error('Data directory initialization error:', e);
}

// Get all coupons
app.get('/api/coupons', (req, res) => {
  try {
    if (fs.existsSync(COUPONS_FILE)) {
      const data = fs.readFileSync(COUPONS_FILE, 'utf-8');
      const coupons = JSON.parse(data || '[]');
      return res.json(coupons);
    }
    return res.json([]);
  } catch (err) {
    console.error('Error reading coupons file:', err);
    return res.json([]);
  }
});

// Save or update coupons
app.post('/api/coupons', (req, res) => {
  try {
    const incoming = req.body;
    let couponsList = [];
    if (Array.isArray(incoming)) {
      couponsList = incoming;
    } else if (incoming && typeof incoming === 'object') {
      let current: any[] = [];
      if (fs.existsSync(COUPONS_FILE)) {
        try {
          current = JSON.parse(fs.readFileSync(COUPONS_FILE, 'utf-8') || '[]');
        } catch (_) {}
      }
      const cleanCode = (incoming.code || '').toUpperCase().trim();
      const existingIdx = current.findIndex((c: any) => c.id === incoming.id || (c.code && c.code.toUpperCase() === cleanCode));
      if (existingIdx >= 0) {
        current[existingIdx] = { ...current[existingIdx], ...incoming, code: cleanCode };
      } else {
        current.push({
          id: incoming.id || `cup_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          code: cleanCode,
          type: incoming.type || 'percentage',
          value: Number(incoming.value) || 10,
          minSpend: incoming.minSpend ? Number(incoming.minSpend) : 0,
          maxUses: incoming.maxUses ? Number(incoming.maxUses) : undefined,
          usageCount: incoming.usageCount || 0,
          description: incoming.description || '',
          active: incoming.active !== false,
          expiresAt: incoming.expiresAt || '',
          createdAt: incoming.createdAt || new Date().toISOString(),
        });
      }
      couponsList = current;
    }
    fs.writeFileSync(COUPONS_FILE, JSON.stringify(couponsList, null, 2), 'utf-8');
    return res.json({ success: true, coupons: couponsList });
  } catch (err: any) {
    console.error('Error saving coupons:', err);
    return res.status(500).json({ error: 'Error al guardar cupones', details: err.message });
  }
});

// Delete coupon
app.delete('/api/coupons/:id', (req, res) => {
  try {
    const { id } = req.params;
    let current: any[] = [];
    if (fs.existsSync(COUPONS_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(COUPONS_FILE, 'utf-8') || '[]');
      } catch (_) {}
    }
    const filtered = current.filter((c: any) => c.id !== id && c.code?.toUpperCase() !== id?.toUpperCase());
    fs.writeFileSync(COUPONS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return res.json({ success: true, coupons: filtered });
  } catch (err: any) {
    console.error('Error deleting coupon:', err);
    return res.status(500).json({ error: 'Error al eliminar cupón', details: err.message });
  }
});

// Get all products (shared globally across all users and devices)
app.get('/api/products', (req, res) => {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const products = JSON.parse(data || '[]');
      return res.json(products);
    }
    return res.json([]);
  } catch (err) {
    console.error('Error reading products file:', err);
    return res.json([]);
  }
});

// Save all products (from admin dashboard to server file)
app.post('/api/products', (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Formato no válido, se requiere un array.' });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    return res.json({ success: true, count: products.length });
  } catch (err: any) {
    console.error('Error saving products file:', err);
    return res.status(500).json({ error: 'Error guardando productos en el servidor' });
  }
});

// CORS support for batch API
app.options('/api/products/batch', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

// Batch import products (inserts new items or updates existing ones, in batches of 10 or more)
app.post('/api/products/batch', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const rawBody = req.body;
    const providedKey = req.headers['x-admin-key'] || req.headers['x-admin-pin'] || rawBody?.adminKey || rawBody?.adminPin;
    const validKeys = ['t.il]?YDY^dC5EC^', '$hjL$g}Z)%Z7.$pD', 'admin', '1234'];
    
    if (providedKey && !validKeys.includes(String(providedKey).trim())) {
      return res.status(401).json({ error: 'Clave de administrador incorrecta para importar camisetas.' });
    }

    const incomingItems = Array.isArray(rawBody) ? rawBody : (rawBody?.products || []);

    if (!Array.isArray(incomingItems) || incomingItems.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de productos en el cuerpo de la petición.' });
    }

    let existingProducts: any[] = [];
    if (fs.existsSync(PRODUCTS_FILE)) {
      try {
        existingProducts = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8') || '[]');
      } catch (e) {
        existingProducts = [];
      }
    }

    let addedCount = 0;
    let updatedCount = 0;

    for (const item of incomingItems) {
      if (!item.title && !item.name && !item.Titulo) continue;

      const cleanTitle = (item.title || item.name || item.Titulo || '').trim();
      const supplierUrl = item.supplierUrl || item.Enlace_Yupoo || item.url || '';
      const imageUrl = item.imageUrl || item.image || item.Imagen_URL || '';

      const extractAlbum = (u: string) => {
        const m = (u || '').match(/albums\/(\d+)/i);
        return m ? m[1] : '';
      };
      const incomingAlbum = extractAlbum(supplierUrl);
      const incomingNormTitle = cleanTitle.toLowerCase().replace(/\s+/g, ' ');

      const matchIndex = existingProducts.findIndex((p: any) => {
        if (item.id && p.id === item.id) return true;
        if (incomingAlbum && extractAlbum(p.supplierUrl) === incomingAlbum) return true;
        if (supplierUrl && p.supplierUrl && supplierUrl.split('?')[0].toLowerCase() === (p.supplierUrl || '').split('?')[0].toLowerCase()) return true;
        if (p.title && p.title.trim().toLowerCase().replace(/\s+/g, ' ') === incomingNormTitle) return true;
        return false;
      });

      const rawSection = String(item.section || '').trim();
      const rawNotes = String(item.notes || item.description || '').trim();
      const rawTeam = String(item.team || '').trim();
      const combinedMeta = `${cleanTitle} ${rawTeam} ${rawNotes} ${supplierUrl} ${rawSection}`.toLowerCase();

      // Check if product belongs to Brazilian league / clubs
      const isBrazilLeague = (
        /brasileir[aã]o|brasileiro|liga\s+brasileña|brazil.*serie/i.test(rawSection) ||
        /brasileir[aã]o|brasileiro_serie_a|brasileiro/i.test(rawNotes) ||
        /referrercate=680738/.test(supplierUrl) ||
        /\b(flamengo|palmeiras|corinthians|sao paulo|são paulo|gr[eê]mio|fluminense|botafogo(-sp)?|cruzeiro|vasco(\s+da\s+gama)?|atl[eé]tico\s+mineiro|atl[eé]tico-mg|galomg|bahia|ath?letico\s+paranaense|(red\s+bull\s+)?bragantino|fortaleza|cuiab[aá]|juventude|sport\s+recife|coritiba|goi[aá]s|cear[aá]|chapecoense|ava[ií]|am[eé]rica\s+mineiro|atl[eé]tico\s+goianiense|crici[uú]ma|ponte\s+preta|paysandu|santa\s+cruz|remo|n[aá]utico)\b/i.test(combinedMeta) ||
        (/\bsantos\b/i.test(combinedMeta) && !/santos\s+laguna/i.test(combinedMeta)) ||
        (/\binternacional\b/i.test(combinedMeta) && !/milan|internazionale|miami/i.test(combinedMeta)) ||
        (/\bvitor?ia\b/i.test(combinedMeta) && !/guimar|setubal/i.test(combinedMeta))
      );

      let resolvedSection = rawSection || 'Temporada 26/27';

      // Always normalize Brazilian section variations
      if (/brasileir[aã]o|brasileiro|liga\s+brasileña/i.test(resolvedSection)) {
        resolvedSection = 'Brasileirão';
      }

      // If Brazilian club or league, MUST be assigned to Brasileirão and NEVER mixed with Italian Serie A or Argentine league
      if (isBrazilLeague) {
        resolvedSection = 'Brasileirão';
      }

      // Resolve sections array
      let resolvedSections: string[] = [];
      if (Array.isArray(item.sections) && item.sections.length > 0) {
        resolvedSections = item.sections.map((s: string) => {
          if (/brasileir[aã]o|brasileiro|liga\s+brasileña/i.test(s)) return 'Brasileirão';
          if (isBrazilLeague && (s === 'Serie A' || s === 'Liga Profesional ARG')) return 'Brasileirão';
          return s;
        });
        if (isBrazilLeague && !resolvedSections.includes('Brasileirão')) {
          resolvedSections.unshift('Brasileirão');
        }
      } else {
        resolvedSections = [resolvedSection];
        if (/26\/27|2026\/27/.test(cleanTitle) && resolvedSection !== 'Temporada 26/27') resolvedSections.push('Temporada 26/27');
        if (/25\/26|2025\/26/.test(cleanTitle) && resolvedSection !== 'Temporada 25/26') resolvedSections.push('Temporada 25/26');
        if (/retro|classic|198|199|9\d\/\d\d|0\d\/\d\d/i.test(cleanTitle) && resolvedSection !== 'Retro') resolvedSections.push('Retro');
      }

      // Filter duplicates
      resolvedSections = Array.from(new Set(resolvedSections));

      const normalizedProduct = {
        id: item.id || `prod_batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: cleanTitle,
        price: typeof item.price === 'number' ? item.price : (parseFloat(item.price) || 24.99),
        originalPrice: typeof item.originalPrice === 'number' ? item.originalPrice : (item.originalPrice ? parseFloat(item.originalPrice) : undefined),
        costPrice: typeof item.costPrice === 'number' ? item.costPrice : (parseFloat(item.costPrice) || 9.50),
        section: resolvedSection,
        sections: resolvedSections,
        team: item.team || '',
        season: item.season || '26/27',
        imageUrl: imageUrl,
        images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (imageUrl ? [imageUrl] : []),
        availableEditions: Array.isArray(item.availableEditions) && item.availableEditions.length > 0
          ? item.availableEditions
          : (resolvedSection === 'Retro' || (resolvedSections && resolvedSections.includes('Retro')) || /retro|classic/i.test(cleanTitle) ? ['FAN VERSION'] : ['FAN VERSION', 'PLAYER VERSION']),
        sizes: Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : ['S', 'M', 'L', 'XL', '2XL'],
        inStock: item.inStock !== false,
        featured: Boolean(item.featured),
        notes: item.notes || item.description || '',
        supplierUrl: supplierUrl,
        createdAt: item.createdAt || new Date().toISOString(),
      };

      if (matchIndex >= 0) {
        existingProducts[matchIndex] = { ...existingProducts[matchIndex], ...normalizedProduct };
        updatedCount++;
      } else {
        existingProducts.push(normalizedProduct);
        addedCount++;
      }
    }

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(existingProducts, null, 2), 'utf-8');

    return res.json({
      success: true,
      batchReceived: incomingItems.length,
      added: addedCount,
      updated: updatedCount,
      totalProductsInStore: existingProducts.length,
    });
  } catch (err: any) {
    console.error('Error in /api/products/batch:', err);
    return res.status(500).json({ error: 'Error procesando lote de productos', details: err.message });
  }
});

// Endpoint to run deduplication on demand
app.post('/api/products/deduplicate', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) {
      return res.json({ success: true, removed: 0, total: 0, breakdown: {} });
    }
    const products: any[] = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8') || '[]');
    const extractAlbum = (u: string) => {
      const m = (u || '').match(/albums\/(\d+)/i);
      return m ? m[1] : '';
    };

    const normUrl = (u: string) => (u || '').split('?')[0].trim().toLowerCase();
    const normTitle = (t: string) => (t || '').trim().toLowerCase().replace(/\s+/g, ' ');

    const parent: number[] = products.map((_, i) => i);
    const find = (i: number): number => {
      if (parent[i] === i) return i;
      parent[i] = find(parent[i]);
      return parent[i];
    };
    const union = (i: number, j: number) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) parent[rootI] = rootJ;
    };

    const albumMap = new Map<string, number>();
    const urlMap = new Map<string, number>();
    const titleMap = new Map<string, number>();

    products.forEach((p, idx) => {
      const alb = extractAlbum(p.supplierUrl);
      const u = normUrl(p.supplierUrl);
      const t = normTitle(p.title);
      if (alb) {
        if (albumMap.has(alb)) union(idx, albumMap.get(alb)!);
        else albumMap.set(alb, idx);
      }
      if (u) {
        if (urlMap.has(u)) union(idx, urlMap.get(u)!);
        else urlMap.set(u, idx);
      }
      if (t) {
        if (titleMap.has(t)) union(idx, titleMap.get(t)!);
        else titleMap.set(t, idx);
      }
    });

    const clusters = new Map<number, any[]>();
    for (let idx = 0; idx < products.length; idx++) {
      const root = find(idx);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root)!.push(products[idx]);
    }

    const cleanList: any[] = [];
    for (const cluster of clusters.values()) {
      // Pick best product in cluster
      cluster.sort((a, b) => {
        const secPriority = (p: any) => {
          const s = p.section || '';
          if (s === 'Brasileirão' || s === 'LaLiga' || s === 'Premier League' || s === 'Serie A') return 10;
          if (s && s !== 'Temporada 26/27' && s !== 'Temporada 25/26' && s !== 'Populares') return 8;
          if (s === 'Retro') return 7;
          return 2;
        };
        const pDiff = secPriority(b) - secPriority(a);
        if (pDiff !== 0) return pDiff;
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      const best = { ...cluster[0] };
      for (const sibling of cluster) {
        if (!best.supplierUrl && sibling.supplierUrl) best.supplierUrl = sibling.supplierUrl;
        if (!best.imageUrl && sibling.imageUrl) best.imageUrl = sibling.imageUrl;
        if (!best.notes && sibling.notes) best.notes = sibling.notes;
        if ((!best.costPrice || best.costPrice === 0) && sibling.costPrice) best.costPrice = sibling.costPrice;
      }
      cleanList.push(best);
    }

    const removedCount = products.length - cleanList.length;
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(cleanList, null, 2), 'utf-8');

    const breakdown: Record<string, number> = {};
    for (const p of cleanList) {
      const sec = p.section || 'Sin Categoría';
      breakdown[sec] = (breakdown[sec] || 0) + 1;
    }

    return res.json({
      success: true,
      removed: removedCount,
      total: cleanList.length,
      breakdown,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error deduplicating products', details: err.message });
  }
});

// Endpoint to run re-classification of products according to supplierUrl and notes
app.post('/api/products/reclassify', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) {
      return res.json({ success: true, count: 0 });
    }
    const products: any[] = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8') || '[]');
    const REFERRERCATE_TO_SECTION: Record<string, string> = {
      '680738': 'Brasileirão',
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

    let updatedCount = 0;
    for (const p of products) {
      const t = String(p.title || '').trim().toLowerCase();
      const u = String(p.supplierUrl || '').trim();
      const n = String(p.notes || '').trim().toLowerCase();

      const m = u.match(/referrercate=(\d+)/);
      const ref = m ? m[1] : '';

      let targetSection = '';

      if (ref && REFERRERCATE_TO_SECTION[ref]) {
        targetSection = REFERRERCATE_TO_SECTION[ref];
      } else if (/\b(training|chandal|chándal|pants|pantalon|pantalón|tracksuit|windbreaker|cortaviento|jacket|trench coat)\b/.test(t)) {
        targetSection = 'Ropa Entrenamiento & Cortavientos';
      } else if (/\b(kids kit|kid kit|conjunto nino|conjunto niño)\b/.test(t)) {
        targetSection = 'Conjuntos Especiales';
      } else if (ref === '680738' || /\b(brasileir[aã]o|brasileiro|flamengo|palmeiras|corinthians|sao paulo|são paulo|gremio|grêmio|fluminense|botafogo(-sp)?|cruzeiro|vasco(\s+da\s+gama)?|atletico mineiro|atlético mineiro|atletico-mg|galomg|bahia|athletico paranaense|atletico paranaense|bragantino|fortaleza|cuiaba|cuiabá|juventude|sport recife|coritiba|goias|goiás|ceara|ceará|chapecoense|avai|avaí|paysandu|santa cruz|remo|nautico|náutico)\b/.test(t) || (/\bsantos\b/.test(t) && !/santos laguna/.test(t)) || (/\binternacional\b/.test(t) && !/milan|internazionale|miami/.test(t))) {
        targetSection = 'Brasileirão';
      } else if (ref === '680717') {
        targetSection = 'LaLiga';
      } else if (/\b(japan|japon|yokohama|vissel|kobe|shimizu|sanfrecce|grampus|sanga|frontale|reysol|antlers|gamba|cerezo|tokyo|fukuoka|yakos|urawa|consadole)\b/.test(t)) {
        targetSection = 'Japon League';
      } else if (/\b(miami|galaxy|lafc|chicago fire|sounders|timbers|columbus|austin fc|nycfc|red bulls|mls)\b/.test(t)) {
        targetSection = 'MLS';
      } else if (/\b(america|chivas|cruz azul|tigres|monterrey|pumas|toluca|santos laguna|pachuca|atlas|leon|puebla|tijuana|mazatlan|necaxa|juarez|atlante)\b/.test(t)) {
        targetSection = 'Liga MX';
      } else if (/\b(rangers|celtic|celtics|aberdeen|hearts|hibernian)\b/.test(t)) {
        targetSection = 'Liga Escocesa';
      } else if (/\b(benfica|sporting lisbon|sporting cp|porto|famalicao|braga|boavista|guimaraes|rio ave)\b/.test(t)) {
        targetSection = 'Primeira Liga';
      } else if (/\b(ajax|feyenoord|psv|alkmaar)\b/.test(t)) {
        targetSection = 'Eredivisie';
      } else if (/\b(psg|paris|marseille|monaco|lyon|rennais|rennes|lille|losc|lens|nantes|strasbourg|toulouse|reims|brest|ligue 1)\b/.test(t)) {
        targetSection = 'Ligue 1';
      } else if (/\b(juventus|milan|inter|roma|napoli|lazio|fiorentina|atalanta|torino|bologna|genoa|parma|como|monza|udinese|cagliari|verona|empoli|lecce|venezia|serie a)\b/.test(t)) {
        targetSection = 'Serie A';
      } else if (/\b(liverpool|arsenal|chelsea|tottenham|spurs|aston villa|villa|newcastle|west ham|westham|everton|brighton|wolves|wolverhampton|fulham|crystal palace|brentford|nottingham|leicester|ipswich|southampton|bournemouth|wrexham|manchester|premier)\b/.test(t)) {
        targetSection = 'Premier League';
      } else if (/\b(bayern|dortmund|bvb|leverkusen|leipzig|frankfurt|stuttgart|wolfsburg|gladbach|freiburg|augsburg|mainz|hoffenheim|heidenheim|bochum|union berlin|werder|bundesliga)\b/.test(t)) {
        targetSection = 'Bundesliga';
      } else if (/\b(boca|river|racing|independiente|san lorenzo|velez|vélez|estudiantes|newells|rosario|argentinos juniors|colo colo|universidad de chile|universidad católica|penarol|nacional)\b/.test(t)) {
        targetSection = 'Liga Profesional ARG';
      } else if (/\b(spain|españa|argentina|brazil|brasil|france|francia|england|inglaterra|germany|alemania|portugal|italy|italia|netherlands|holanda|belgium|belgica|uruguay|colombia|croatia|croacia|morocco|marruecos|usa)\b/.test(t)) {
        targetSection = 'Mundial 2026';
      } else if (/\b(madrid|barcelona|barça|atletico|atlético|betis|sevilla|athletic|valencia|villarreal|sociedad|celta|osasuna|mallorca|getafe|rayo|espanyol|girona|alaves|las palmas|leganes|valladolid|laliga)\b/.test(t)) {
        targetSection = 'LaLiga';
      } else if (/\b(retro|classic|198|199|90\/91|91\/92|92\/93|93\/94|94\/95|95\/96|96\/97|97\/98|98\/99|99\/00)\b/.test(t)) {
        targetSection = 'Retro';
      }

      if (targetSection) {
        p.section = targetSection;
        const currentSections = new Set([targetSection]);
        if (/26\/27|2026\/27/.test(t)) currentSections.add('Temporada 26/27');
        if (/25\/26|2025\/26/.test(t)) currentSections.add('Temporada 25/26');
        if (/retro|classic|198|199|9\d\/\d\d|0\d\/\d\d/.test(t)) currentSections.add('Retro');
        p.sections = Array.from(currentSections);
        updatedCount++;
      }
    }

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    return res.json({ success: true, count: updatedCount, total: products.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error reclassifying products', details: err.message });
  }
});

// Image proxy to bypass Yupoo hotlink protection and serve images reliably to any browser
app.get('/api/image-proxy', async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }

  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return res.status(400).send('Invalid url parameter');
  }

  // Create fallback URLs with different resolutions
  const urlsToTry = [imageUrl];
  if (imageUrl.includes('/medium.')) {
    urlsToTry.push(imageUrl.replace('/medium.', '/small.'));
    urlsToTry.push(imageUrl.replace('/medium.', '/big.'));
  } else if (imageUrl.includes('/small.')) {
    urlsToTry.push(imageUrl.replace('/small.', '/medium.'));
    urlsToTry.push(imageUrl.replace('/small.', '/big.'));
  } else if (imageUrl.includes('/big.')) {
    urlsToTry.push(imageUrl.replace('/big.', '/medium.'));
    urlsToTry.push(imageUrl.replace('/big.', '/small.'));
  }

  const referrers = ['https://minkang.x.yupoo.com/', 'https://photo.yupoo.com/', 'https://yupoo.com/'];

  for (const url of urlsToTry) {
    for (const ref of referrers) {
      try {
        const upstream = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': ref,
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        });

        if (upstream.ok) {
          const contentType = upstream.headers.get('content-type') || 'image/jpeg';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

          const arrayBuffer = await upstream.arrayBuffer();
          return res.send(Buffer.from(arrayBuffer));
        }
      } catch (e) {
        // try next
      }
    }
  }

  return res.status(404).send('Image could not be retrieved');
});

// Lazy Stripe initialization to never crash on startup if key is not yet provided
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    stripeClient = new Stripe(key, {
      apiVersion: '2025-02-24.acacia' as any,
    });
  }
  return stripeClient;
}

// Endpoint to download complete project ZIP
app.get('/api/download-project-zip', (req, res) => {
  try {
    const zipPath = path.join(process.cwd(), 'public', 'kitshub-codigo-completo.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="kitshub-codigo-completo.zip"');
      return res.sendFile(zipPath);
    }
    return res.status(404).send('Archivo ZIP no encontrado.');
  } catch (err) {
    console.error('Error serving ZIP:', err);
    return res.status(500).send('Error al descargar ZIP.');
  }
});

// Check payment gateway status (Stripe / Klarna)
app.get('/api/payment-status', (req, res) => {
  const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);
  res.json({
    stripeConfigured: hasStripe,
    methods: {
      card: true,
      klarna: hasStripe,
      applePay: hasStripe,
      googlePay: hasStripe,
    },
  });
});

// Create Stripe & Klarna Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const stripe = getStripe();
    const { orderId, amount, customer, items, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Importe no válido' });
    }

    if (!stripe) {
      return res.status(503).json({
        error: 'STRIPE_NOT_CONFIGURED',
        message: 'La clave STRIPE_SECRET_KEY no está configurada en las variables de entorno del servidor.',
      });
    }

    // Determine host for redirect URLs
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

    // Payment methods for Stripe Checkout (Card, Klarna, etc.)
    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = 
      paymentMethod === 'klarna' 
        ? ['klarna', 'card'] 
        : ['card', 'klarna'];

    // Safe & discreet statement/line item description to protect store owner
    const cleanOrderId = orderId || `PED-${Date.now().toString().slice(-6)}`;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Pedido Tienda Oficial #${cleanOrderId}`,
              description: 'Equipaciones y prendas deportivas técnicas de fútbol',
              metadata: {
                order_id: cleanOrderId,
                customer_name: customer?.name || '',
                customer_phone: customer?.phone || '',
              },
            },
            unit_amount: Math.round(Number(amount) * 100), // convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customer?.email || undefined,
      metadata: {
        orderId: cleanOrderId,
        customerName: customer?.name || '',
        customerPhone: customer?.phone || '',
        customerCountry: customer?.country || '',
        shippingAddress: `${customer?.address || ''}, ${customer?.city || ''} (${customer?.postalCode || ''})${customer?.country ? ` - ${customer.country}` : ''}`,
      },
      success_url: `${appUrl}/?order_success=true&order_id=${cleanOrderId}&method=${paymentMethod || 'card'}`,
      cancel_url: `${appUrl}/?order_canceled=true&order_id=${cleanOrderId}`,
    });

    return res.json({
      url: session.url,
      sessionId: session.id,
      orderId: cleanOrderId,
    });
  } catch (err: any) {
    console.error('Error creating Stripe session:', err);
    return res.status(500).json({
      error: 'STRIPE_SESSION_ERROR',
      message: err?.message || 'Error al conectar con la pasarela de pago.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
