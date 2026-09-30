import React, { useState, useId, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  DollarSign, 
  Shirt, 
  Download, 
  Eye,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Product, CatalogSection, ProductType } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (products: Product[], replaceExisting: boolean) => void;
  currentProductCount: number;
}

const CATALOG_SECTIONS: CatalogSection[] = [
  'Populares',
  'Temporada 26/27',
  'Temporada 25/26',
  'Retro',
  'Mundial 2026',
  'Mundial',
  'LaLiga',
  'Premier League',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Brasileirão',
  'Liga ARG & Sudamericana',
  'Liga Chilena',
  'Primeira Liga',
  'Eredivisie',
  'Liga MX',
  'MLS',
  'Liga Escocesa',
  'Japon League',
  'Conjuntos Especiales',
  'Ropa Entrenamiento & Cortavientos',
  'Ropa de Moda',
  'Unboxing',
];

// Helper to parse CSV respecting quotes and delimiters
function parseCsvRows(rawText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < rawText.length; i++) {
    const char = rawText[i];
    const nextChar = rawText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' && nextChar === '\n') || char === '\n' || char === '\r') {
      if (inQuotes) {
        currentLine += ' ';
      } else {
        if (char === '\r' && nextChar === '\n') i++;
        if (currentLine.trim()) lines.push(currentLine);
        currentLine = '';
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length === 0) return { headers: [], rows: [] };

  // Detect delimiter from header line
  const firstLine = lines[0];
  const delimiters = [',', ';', '\t', '|'];
  let delimiter = ',';
  let maxCount = 0;
  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      delimiter = d;
    }
  }

  const splitRow = (rowStr: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let insideQuote = false;

    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i];
      const nc = rowStr[i + 1];

      if (c === '"') {
        if (insideQuote && nc === '"') {
          field += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (c === delimiter && !insideQuote) {
        fields.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const rawHeaders = splitRow(lines[0]);
  const headers = rawHeaders.map((h, index) => {
    const cleaned = h.replace(/^["']|["']$/g, '').trim();
    return cleaned || `Columna_${index + 1}`;
  });

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const lineFields = splitRow(lines[i]);
    if (lineFields.length === 0 || (lineFields.length === 1 && !lineFields[0])) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      let val = lineFields[idx] || '';
      val = val.replace(/^["']|["']$/g, '').trim();
      rowObj[h] = val;
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// Auto-guess columns from header names
function autoDetectColumn(headers: string[], patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const found = headers.find(h => pattern.test(h.toLowerCase().trim()));
    if (found) return found;
  }
  return '';
}

// Auto-categorize title to appropriate catalog section
function guessSectionFromTitle(title: string, defaultSection: CatalogSection): CatalogSection {
  const t = title.toLowerCase();
  if (t.includes('retro') || t.includes('199') || t.includes('2000') || t.includes('2002') || t.includes('2004') || t.includes('2006') || t.includes('classic')) {
    return 'Retro';
  }

  // South American & Colombian clubs (Atlético Nacional, Peñarol, etc.)
  if (
    t.includes('national athletic') || t.includes('atletico nacional') || t.includes('atlético nacional') ||
    t.includes('nacional de medellin') || t.includes('nacional medellin') || t.includes('boca') ||
    t.includes('river') || t.includes('racing club') || t.includes('independiente') ||
    t.includes('san lorenzo') || t.includes('vélez') || t.includes('velez') || t.includes('peñarol') ||
    t.includes('penarol') || t.includes('nacional uruguay') || t.includes('millonarios') ||
    t.includes('santa fe') || t.includes('junior barranquilla') || t.includes('america de cali') ||
    t.includes('deportivo cali') || t.includes('liga de quito') || t.includes('olimpia') ||
    t.includes('cerro porteño') || t.includes('cerro porteno') || t.includes('argentina')
  ) {
    return 'Liga ARG & Sudamericana';
  }

  // Chilean League
  if (t.includes('colo colo') || t.includes('universidad de chile') || t.includes('u de chile') || t.includes('universidad catolica') || t.includes('universidad católica') || t.includes('cobreloa')) {
    return 'Liga Chilena';
  }

  // Brazilian clubs & league detection
  if (
    t.includes('brasileir') || t.includes('flamengo') || t.includes('palmeiras') ||
    t.includes('corinthians') || t.includes('sao paulo') || t.includes('são paulo') ||
    t.includes('gremio') || t.includes('grêmio') || t.includes('fluminense') ||
    t.includes('botafogo') || t.includes('cruzeiro') || t.includes('vasco') ||
    t.includes('bahia') || t.includes('atletico mineiro') || t.includes('atlético mineiro') ||
    t.includes('athletico paranaense') || t.includes('atletico paranaense') ||
    t.includes('bragantino') || t.includes('fortaleza') || t.includes('cuiaba') ||
    t.includes('cuiabá') || t.includes('juventude') || t.includes('sport recife') ||
    t.includes('coritiba') || t.includes('goias') || t.includes('goiás') ||
    t.includes('chapecoense') || t.includes('avai') || t.includes('avaí') ||
    t.includes('paysandu') || t.includes('santa cruz') || t.includes('remo') ||
    t.includes('nautico') || t.includes('náutico') ||
    (t.includes('santos') && !t.includes('santos laguna')) ||
    (t.includes('internacional') && !t.includes('milan') && !t.includes('miami'))
  ) {
    return 'Brasileirão';
  }

  // Bundesliga / Germany
  if (t.includes('cologne') || t.includes('koln') || t.includes('köln') || t.includes('bayern') || t.includes('dortmund') || t.includes('leverkusen') || t.includes('bundesliga') || t.includes('leipzig') || t.includes('stuttgart') || t.includes('frankfurt') || t.includes('schalke') || t.includes('bremen')) {
    return 'Bundesliga';
  }

  // Liga MX
  if (t.includes('liga mx') || t.includes('america mexico') || t.includes('améric') || t.includes('chivas') || t.includes('guadalajara') || t.includes('cruz azul') || t.includes('tigres') || t.includes('monterrey') || t.includes('pumas') || t.includes('toluca') || t.includes('atletico san luis') || t.includes('santos laguna') || t.includes('puebla') || t.includes('atlas') || t.includes('leon') || t.includes('león') || t.includes('pachuca') || t.includes('tijuana') || t.includes('queretaro') || t.includes('mazatlan') || t.includes('necaxa') || t.includes('juarez') || t.includes('atlante')) {
    return 'Liga MX';
  }

  // Strict Spanish LaLiga matching ONLY
  const isSpanishClub = (
    t.includes('real madrid') || (t.includes('madrid') && !t.includes('atletico')) ||
    t.includes('barça') || t.includes('barca') || t.includes('barcelona') ||
    t.includes('atletico madrid') || t.includes('atlético madrid') || t.includes('atletico de madrid') || t.includes('atlético de madrid') || (t.includes('atleti') && !t.includes('athletic')) ||
    t.includes('athletic bilbao') || t.includes('athletic club') || t.includes('bilbao') ||
    t.includes('real betis') || (t.includes('betis') && !t.includes('betis b')) ||
    t.includes('sevilla') || t.includes('real sociedad') || (t.includes('sociedad') && !t.includes('anonima')) ||
    t.includes('valencia') || t.includes('villarreal') || t.includes('laliga') || t.includes('la liga') ||
    t.includes('celta vigo') || t.includes('celta de vigo') || (t.includes('celta') && !t.includes('celtic')) ||
    t.includes('mallorca') || t.includes('osasuna') || t.includes('alavés') || t.includes('alaves') ||
    t.includes('rayo vallecano') || (t.includes('vallecano') || t.includes('rayo')) ||
    t.includes('las palmas') || t.includes('espanyol') || t.includes('getafe') ||
    t.includes('leganés') || t.includes('leganes') || t.includes('valladolid') ||
    t.includes('deportivo la coruña') || t.includes('deportivo la coruna') || t.includes('deportivo de la coruna') ||
    t.includes('zaragoza') || t.includes('málaga') || t.includes('malaga') ||
    t.includes('sporting gijon') || t.includes('sporting gijón') ||
    t.includes('oviedo') || t.includes('cádiz') || t.includes('cadiz') ||
    t.includes('elche') || t.includes('córdoba') || t.includes('cordoba') ||
    t.includes('tenerife') || t.includes('albacete') || t.includes('recreativo') ||
    t.includes('racing santander') || t.includes('eibar') || t.includes('almería') ||
    t.includes('almeria') || t.includes('levante') || t.includes('granada') ||
    t.includes('mirandes') || t.includes('mirandés') || t.includes('burgos') ||
    t.includes('huesca') || t.includes('castellon') || t.includes('castellón') ||
    t.includes('eldense') || t.includes('cartagena') || t.includes('cultural leonesa') ||
    t.includes('real murcia')
  );

  if (isSpanishClub) {
    return 'LaLiga';
  }

  if (t.includes('liverpool') || t.includes('arsenal') || t.includes('city') || t.includes('united') || t.includes('chelsea') || t.includes('tottenham') || t.includes('aston villa') || t.includes('premier')) {
    return 'Premier League';
  }
  if (t.includes('juventus') || t.includes('milan') || t.includes('inter') || t.includes('roma') || t.includes('napoli') || t.includes('serie a')) {
    return 'Serie A';
  }
  if (t.includes('psg') || t.includes('paris') || t.includes('marseille') || t.includes('monaco') || t.includes('ligue 1')) {
    return 'Ligue 1';
  }
  if (t.includes('inter miami') || t.includes('mls') || t.includes('galaxy')) {
    return 'MLS';
  }
  if (t.includes('benfica') || t.includes('porto') || t.includes('sporting cp') || t.includes('primeira')) {
    return 'Primeira Liga';
  }
  if (t.includes('ajax') || t.includes('psv') || t.includes('feyenoord') || t.includes('eredivisie')) {
    return 'Eredivisie';
  }
  if (t.includes('celtic') || t.includes('rangers') || t.includes('escocesa')) {
    return 'Liga Escocesa';
  }
  if (t.includes('mundial') || t.includes('world cup') || t.includes('españa') || t.includes('francia') || t.includes('brasil') || t.includes('germany') || t.includes('portugal')) {
    return 'Mundial 2026';
  }
  if (t.includes('chándal') || t.includes('chandal') || t.includes('pantalon') || t.includes('training') || t.includes('cortaviento') || t.includes('windbreaker') || t.includes('sudadera')) {
    return 'Ropa Entrenamiento & Cortavientos';
  }
  if (t.includes('pack') || t.includes('conjunto') || t.includes('set') || t.includes('kit especial')) {
    return 'Conjuntos Especiales';
  }
  return defaultSection;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportProducts,
  currentProductCount,
}) => {
  const modalTitleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps: 'upload' | 'mapping' | 'preview'
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  // Raw parsed data
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [pastedText, setPastedText] = useState('');

  // Column Mappings
  const [titleCol, setTitleCol] = useState('');
  const [imageCol, setImageCol] = useState('');
  const [priceCol, setPriceCol] = useState('');
  const [costCol, setCostCol] = useState('');
  const [sectionCol, setSectionCol] = useState('');
  const [sizesCol, setSizesCol] = useState('');
  const [teamCol, setTeamCol] = useState('');
  const [seasonCol, setSeasonCol] = useState('');
  const [codeCol, setCodeCol] = useState('');
  const [descriptionCol, setDescriptionCol] = useState('');

  // Price Calculation Strategy
  const [pricingMode, setPricingMode] = useState<'csv_price' | 'fixed' | 'margin_fixed' | 'margin_percent'>('csv_price');
  const [fixedPriceValue, setFixedPriceValue] = useState('12.99');
  const [marginAddValue, setMarginAddValue] = useState('10.00');
  const [marginMultiplier, setMarginMultiplier] = useState('1.5');

  // General Defaults
  const [defaultSection, setDefaultSection] = useState<CatalogSection>('Populares');
  const [defaultSizes, setDefaultSizes] = useState('S, M, L, XL, 2XL');
  const [supplierName, setSupplierName] = useState('Proveedor Catálogo CSV');
  const [allowEditions, setAllowEditions] = useState(true);
  const [playerVersionExtra, setPlayerVersionExtra] = useState('2.00');
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Processed Preview Items
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  // Handle file selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) processRawText(text, file.name);
    };
    reader.readAsText(file);
  };

  // Process text and auto-map
  const processRawText = (text: string, name = 'archivo.csv') => {
    const { headers: parsedHeaders, rows: parsedRows } = parseCsvRows(text);
    if (parsedHeaders.length === 0 || parsedRows.length === 0) {
      alert('No se detectaron filas válidas en el archivo CSV. Asegúrate de que no esté vacío.');
      return;
    }

    setFileName(name);
    setHeaders(parsedHeaders);
    setRawRows(parsedRows);

    // Auto-detect mappings
    const tCol = autoDetectColumn(parsedHeaders, [/titl/i, /nombre/i, /name/i, /producto/i, /product/i, /desc/i, /articulo/i, /item/i, /model/i]);
    const iCol = autoDetectColumn(parsedHeaders, [/image/i, /foto/i, /img/i, /pic/i, /imagen/i, /photo/i, /url_foto/i, /picture/i]);
    const pCol = autoDetectColumn(parsedHeaders, [/precio.*venta/i, /pvp/i, /price/i, /precio/i, /sale_price/i, /retail/i]);
    const cCol = autoDetectColumn(parsedHeaders, [/coste/i, /cost/i, /precio.*coste/i, /precio.*proveedor/i, /wholesale/i, /rmb/i, /usd/i]);
    const sCol = autoDetectColumn(parsedHeaders, [/seccion/i, /section/i, /categoria/i, /category/i, /liga/i, /league/i]);
    const szCol = autoDetectColumn(parsedHeaders, [/tallas?/i, /sizes?/i, /size/i]);
    const tmCol = autoDetectColumn(parsedHeaders, [/equipo/i, /team/i, /club/i]);
    const snCol = autoDetectColumn(parsedHeaders, [/temporada/i, /season/i, /year/i, /año/i]);
    const cdCol = autoDetectColumn(parsedHeaders, [/sku/i, /code/i, /codigo/i, /ref/i, /referencia/i, /id/i]);
    const dsCol = autoDetectColumn(parsedHeaders, [/descrip/i, /details/i, /detalles/i, /info/i]);

    setTitleCol(tCol || parsedHeaders[0] || '');
    setImageCol(iCol || '');
    setPriceCol(pCol || '');
    setCostCol(cCol || '');
    setSectionCol(sCol || '');
    setSizesCol(szCol || '');
    setTeamCol(tmCol || '');
    setSeasonCol(snCol || '');
    setCodeCol(cdCol || '');
    setDescriptionCol(dsCol || '');

    // If cost col found but no price col, suggest margin
    if (cCol && !pCol) {
      setPricingMode('margin_fixed');
    }

    setStep('mapping');
  };

  // Build products from mapping
  const generatePreview = () => {
    if (!titleCol) {
      alert('Debes seleccionar al menos la columna del Nombre/Título de la camiseta.');
      return;
    }

    const defaultSizesArray = defaultSizes
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const generated: Product[] = rawRows.map((row, idx) => {
      const rawTitle = row[titleCol] || `Camiseta #${idx + 1}`;
      
      // Image: extract first URL if multiple URLs separated by comma/space
      let img = '';
      if (imageCol && row[imageCol]) {
        const rawImg = row[imageCol].trim();
        const splitUrls = rawImg.split(/[\s,;|]+/);
        img = splitUrls[0] || rawImg;
      }

      // Cost price
      let cost = 0;
      if (costCol && row[costCol]) {
        const cleanedCost = row[costCol].replace(/[^\d.,]/g, '').replace(',', '.');
        cost = parseFloat(cleanedCost) || 0;
      }

      // Selling price based on strategy
      let finalPrice = 24.99;
      if (pricingMode === 'fixed') {
        finalPrice = parseFloat(fixedPriceValue) || 24.99;
      } else if (pricingMode === 'margin_fixed') {
        const add = parseFloat(marginAddValue) || 15.0;
        finalPrice = cost > 0 ? Number((cost + add).toFixed(2)) : parseFloat(fixedPriceValue) || 24.99;
      } else if (pricingMode === 'margin_percent') {
        const mult = parseFloat(marginMultiplier) || 2.0;
        finalPrice = cost > 0 ? Number((cost * mult).toFixed(2)) : parseFloat(fixedPriceValue) || 24.99;
      } else {
        // csv_price
        if (priceCol && row[priceCol]) {
          const cleanedPrice = row[priceCol].replace(/[^\d.,]/g, '').replace(',', '.');
          const parsed = parseFloat(cleanedPrice);
          finalPrice = isNaN(parsed) || parsed <= 0 ? 24.99 : parsed;
        } else if (cost > 0) {
          finalPrice = Number((cost + 15).toFixed(2));
        }
      }

      // Section / Category
      let sec: CatalogSection = defaultSection;
      if (sectionCol && row[sectionCol]) {
        const val = row[sectionCol].trim();
        const match = CATALOG_SECTIONS.find(s => s.toLowerCase() === val.toLowerCase());
        if (match) {
          sec = match;
        } else {
          sec = guessSectionFromTitle(`${val} ${rawTitle}`, defaultSection);
        }
      } else {
        sec = guessSectionFromTitle(rawTitle, defaultSection);
      }

      // Sizes
      let sizes = defaultSizesArray.length > 0 ? defaultSizesArray : ['S', 'M', 'L', 'XL', '2XL'];
      if (sizesCol && row[sizesCol]) {
        const parsedSizes = row[sizesCol].split(/[\s,;|/]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
        if (parsedSizes.length > 0) sizes = parsedSizes;
      }

      // Category type
      let prodType: ProductType = 'Camiseta 25/26';
      if (sec === 'Retro') prodType = 'Camiseta Retro';
      else if (sec === 'Temporada 26/27') prodType = 'Camiseta 26/27';
      else if (sec === 'Conjuntos Especiales') prodType = 'Conjunto Especial / Pack';
      else if (sec === 'Ropa Entrenamiento & Cortavientos') prodType = 'Cortavientos / Chándal';

      const prodId = `csv-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`;

      return {
        id: prodId,
        title: rawTitle,
        section: sec,
        category: prodType,
        supplierName: supplierName || 'Proveedor CSV',
        price: finalPrice,
        costPrice: cost > 0 ? cost : undefined,
        imageUrl: img || undefined,
        images: img ? [img] : [],
        availableSizes: sizes,
        availableEditions: allowEditions ? ['FAN VERSION', 'PLAYER VERSION'] : ['FAN VERSION'],
        playerVersionExtraPrice: allowEditions ? parseFloat(playerVersionExtra) || 2.0 : undefined,
        allowCustomDorsal: true,
        dorsalExtraPrice: 2.0,
        team: (teamCol && row[teamCol]) ? row[teamCol] : undefined,
        season: (seasonCol && row[seasonCol]) ? row[seasonCol] : '2025/2026',
        itemCode: (codeCol && row[codeCol]) ? row[codeCol] : undefined,
        description: (descriptionCol && row[descriptionCol]) ? row[descriptionCol] : undefined,
        dateAdded: new Date().toISOString().slice(0, 10),
      };
    });

    // Deduplicate & Group Fan / Player versions into single cards
    const getGroupKey = (title: string, section: string) => {
      let t = title.toLowerCase();
      t = t.replace(/national\s+athletic/g, 'atletico nacional');
      t = t.replace(/\b(players?(\s+version|\s+edition|\s+issue)?|fan(\s+version|\s+edition)?)\b/g, '');
      t = t.replace(/\b(stadium|game)\b/g, '');
      t = t.replace(/\b(s-[23456]xl|s-xxl|s-xxxl|m-4xl|size\s*\d+-\d+|\d+-\d+)\b/g, '');
      t = t.replace(/[\(\)\-\,\.\/]+/g, ' ');
      return `${t.trim().replace(/\s+/g, ' ')}__${section}`;
    };

    const isPlayerTitle = (title: string) => /\b(player|players|player version|player edition|player issue)\b/i.test(title);

    const groupMap = new Map<string, Product[]>();
    generated.forEach(item => {
      const key = getGroupKey(item.title, item.section);
      const list = groupMap.get(key) || [];
      list.push(item);
      groupMap.set(key, list);
    });

    const deduplicatedProducts: Product[] = [];
    groupMap.forEach((items) => {
      if (items.length === 1) {
        const item = { ...items[0] };
        // Clean title if it contained 'player' / 'players'
        item.title = item.title.replace(/\b(Players?(\s+Version|\s+Edition|\s+Issue)?|Fan\s+Version)\b/gi, '').replace(/\s+/g, ' ').trim();
        if (item.section !== 'Retro') {
          item.availableEditions = ['FAN VERSION', 'PLAYER VERSION'];
          item.playerVersionExtraPrice = parseFloat(playerVersionExtra) || 2.0;
        }
        deduplicatedProducts.push(item);
      } else {
        // Group Fan and Player into single card
        const fanItems = items.filter(it => !isPlayerTitle(it.title));
        const baseItem = fanItems.length > 0 ? { ...fanItems[0] } : { ...items[0] };
        
        baseItem.title = baseItem.title.replace(/\b(Players?(\s+Version|\s+Edition|\s+Issue)?|Fan\s+Version)\b/gi, '').replace(/\s+/g, ' ').trim();
        
        // Merge images
        const allImages: string[] = [];
        items.forEach(it => {
          if (it.imageUrl && !allImages.includes(it.imageUrl)) allImages.push(it.imageUrl);
          (it.images || []).forEach(img => {
            if (img && !allImages.includes(img)) allImages.push(img);
          });
        });
        if (allImages.length > 0) {
          baseItem.imageUrl = allImages[0];
          baseItem.images = allImages;
        }

        // Merge sizes
        const allSizes: string[] = [];
        items.forEach(it => {
          (it.availableSizes || []).forEach(sz => {
            if (sz && !allSizes.includes(sz)) allSizes.push(sz);
          });
        });
        if (allSizes.length > 0) {
          baseItem.availableSizes = allSizes;
        }

        baseItem.availableEditions = ['FAN VERSION', 'PLAYER VERSION'];
        baseItem.playerVersionExtraPrice = parseFloat(playerVersionExtra) || 2.0;
        deduplicatedProducts.push(baseItem);
      }
    });

    setPreviewProducts(deduplicatedProducts);

    // Select all by default
    const selection: Record<string, boolean> = {};
    deduplicatedProducts.forEach(p => {
      selection[p.id] = true;
    });
    setSelectedIds(selection);

    setStep('preview');
  };

  const handleToggleSelectAll = () => {
    const allSelected = Object.values(selectedIds).every(Boolean);
    const updated: Record<string, boolean> = {};
    previewProducts.forEach(p => {
      updated[p.id] = !allSelected;
    });
    setSelectedIds(updated);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleFinishImport = () => {
    const itemsToImport = previewProducts.filter(p => selectedIds[p.id]);
    if (itemsToImport.length === 0) {
      alert('No has seleccionado ninguna camiseta para importar.');
      return;
    }
    onImportProducts(itemsToImport, replaceExisting);
    onClose();
  };

  // Sample CSV generator for user download
  const handleDownloadSampleCsv = () => {
    const csvHeader = 'Nombre,Foto_URL,Precio_Venta,Precio_Coste,Seccion,Tallas,Equipo,Temporada\n';
    const sampleRows = [
      '"Real Madrid 25/26 Primera Equipacion","https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800","24.99","9.50","LaLiga","S,M,L,XL,2XL","Real Madrid","2025/2026"',
      '"FC Barcelona 25/26 Primera Equipacion","https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800","24.99","9.50","LaLiga","S,M,L,XL,2XL","FC Barcelona","2025/2026"',
      '"Camiseta Retro Zidane Final Champions 2002","https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800","28.99","11.00","Retro","S,M,L,XL","Real Madrid","2001/2002"',
    ].join('\n');

    const blob = new Blob([csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_catalogo_kitshub.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
    >
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 id={modalTitleId} className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Importador de Catálogo CSV del Proveedor
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-medium px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Carga Masiva
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Sube el archivo Excel/CSV con fotos y nombres que te pasó tu proveedor para cargar todas las camisetas de golpe.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar Steps */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-900/30 text-xs font-semibold">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-emerald-400 font-bold' : 'text-neutral-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'upload' ? 'bg-emerald-500 text-black' : 'bg-neutral-800'}`}>1</span>
            <span>Subir Archivo CSV</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-600" />
          <div className={`flex items-center gap-2 ${step === 'mapping' ? 'text-emerald-400 font-bold' : 'text-neutral-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'mapping' ? 'bg-emerald-500 text-black' : 'bg-neutral-800'}`}>2</span>
            <span>Detectar Columnas & Precios</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-600" />
          <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-emerald-400 font-bold' : 'text-neutral-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'preview' ? 'bg-emerald-500 text-black' : 'bg-neutral-800'}`}>3</span>
            <span>Vista Previa & Confirmación</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              
              {/* Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-700 hover:border-emerald-500/70 bg-neutral-900/40 hover:bg-neutral-900/80 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 transition transform group-hover:scale-110">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-semibold text-white">
                    Arrastra aquí el archivo CSV de tu proveedor o <span className="text-emerald-400 underline">haz clic para seleccionarlo</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Formatos admitidos: .csv, .tsv, .txt (exportado de Excel, Google Sheets o almacén mayorista)
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv,.txt,.tsv" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </div>

              {/* Alternative: Paste CSV directly */}
              <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="pasted-csv-input" className="text-xs font-semibold text-neutral-300">
                    ¿O prefieres pegar el contenido de tu tabla directamente?
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar plantilla de ejemplo
                  </button>
                </div>
                <textarea
                  id="pasted-csv-input"
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Pega aquí el texto copiado de Excel o Google Sheets con las columnas (ej: Nombre, Foto_URL, Precio...)"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none font-mono"
                />
                {pastedText.trim() && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => processRawText(pastedText, 'texto-pegado.csv')}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      Procesar Texto Pegado <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Explanatory tips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                  <span className="font-semibold text-emerald-400 block mb-1">📸 Fotos Automáticas</span>
                  <p className="text-neutral-400">Si tu CSV tiene enlaces de fotos (Imgur, CDN, Cloudinary o links web directos), se mostrarán directamente en el catálogo.</p>
                </div>
                <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                  <span className="font-semibold text-emerald-400 block mb-1">🏷️ Margen de Ganancia</span>
                  <p className="text-neutral-400">Puedes fijar un precio de venta para tus clientes (ej: 24.99 €) o sumarle tu margen de beneficio al coste del proveedor.</p>
                </div>
                <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                  <span className="font-semibold text-emerald-400 block mb-1">⚡ Detección Inteligente</span>
                  <p className="text-neutral-400">El sistema reconoce automáticamente equipos (Real Madrid, Barça, etc.) y los ubica en sus ligas correspondientes.</p>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & PRICING RULES */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl">
                <div>
                  <span className="text-xs text-emerald-400 font-bold block">Archivo cargado con éxito</span>
                  <span className="text-sm font-semibold text-white">{fileName}</span>
                  <span className="text-xs text-neutral-400 ml-2">({rawRows.length} filas detectadas)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="text-xs text-neutral-400 hover:text-white underline"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Column Selectors */}
              <div className="border border-neutral-800 rounded-xl p-4 sm:p-5 bg-neutral-900/40 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Mapeo de Columnas (¿Qué contiene cada columna de tu archivo?)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  
                  {/* Title / Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="csv-col-title" className="font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Nombre / Título de la camiseta *</span>
                      <span className="text-emerald-400 text-[10px]">Requerido</span>
                    </label>
                    <select
                      id="csv-col-title"
                      value={titleCol}
                      onChange={(e) => setTitleCol(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Selecciona Columna --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h} (ej: &quot;{rawRows[0]?.[h]?.slice(0, 25)}&quot;)</option>
                      ))}
                    </select>
                  </div>

                  {/* Image URL */}
                  <div className="space-y-1.5">
                    <label htmlFor="csv-col-image" className="font-semibold text-neutral-300 flex items-center justify-between">
                      <span>URL de la Foto / Imagen</span>
                      <span className="text-neutral-500 text-[10px]">Recomendado</span>
                    </label>
                    <select
                      id="csv-col-image"
                      value={imageCol}
                      onChange={(e) => setImageCol(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Sin foto / Agregar después --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h} (ej: &quot;{rawRows[0]?.[h]?.slice(0, 25)}&quot;)</option>
                      ))}
                    </select>
                  </div>

                  {/* Cost Price */}
                  <div className="space-y-1.5">
                    <label htmlFor="csv-col-cost" className="font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Precio de Coste (Proveedor)</span>
                      <span className="text-neutral-500 text-[10px]">Privado (solo admin)</span>
                    </label>
                    <select
                      id="csv-col-cost"
                      value={costCol}
                      onChange={(e) => setCostCol(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">-- No incluir coste --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h} (ej: &quot;{rawRows[0]?.[h]?.slice(0, 25)}&quot;)</option>
                      ))}
                    </select>
                  </div>

                  {/* Retail Price Column */}
                  <div className="space-y-1.5">
                    <label htmlFor="csv-col-price" className="font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Precio Venta (PVP en el CSV)</span>
                      <span className="text-neutral-500 text-[10px]">Opcional</span>
                    </label>
                    <select
                      id="csv-col-price"
                      value={priceCol}
                      onChange={(e) => setPriceCol(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">-- No viene en el CSV / Calcular abajo --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h} (ej: &quot;{rawRows[0]?.[h]?.slice(0, 25)}&quot;)</option>
                      ))}
                    </select>
                  </div>

                  {/* Section / Category */}
                  <div className="space-y-1.5">
                    <label htmlFor="csv-col-section" className="font-semibold text-neutral-300">
                      Categoría / Liga en el CSV
                    </label>
                    <select
                      id="csv-col-section"
                      value={sectionCol}
                      onChange={(e) => setSectionCol(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Auto-clasificar por nombre del equipo --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sizes */}
                  <div className="space-y-1.5">
                    <label htmlFor="csv-col-sizes" className="font-semibold text-neutral-300">
                      Tallas en el CSV
                    </label>
                    <select
                      id="csv-col-sizes"
                      value={sizesCol}
                      onChange={(e) => setSizesCol(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Usar tallas estándar (S, M, L, XL, 2XL) --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* Pricing Rules */}
              <div className="border border-neutral-800 rounded-xl p-4 sm:p-5 bg-neutral-900/40 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  Estrategia de Precios para tus Clientes (PVP)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  
                  <label className={`p-3.5 border rounded-xl cursor-pointer flex flex-col justify-between gap-2 transition ${pricingMode === 'fixed' ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-950'}`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="pricingMode" 
                        checked={pricingMode === 'fixed'} 
                        onChange={() => setPricingMode('fixed')} 
                        className="text-emerald-500"
                      />
                      <span className="font-bold text-white">Precio Único Fijo</span>
                    </div>
                    <p className="text-neutral-400 text-[11px]">Todas las camisetas se pondrán a la venta al mismo precio.</p>
                    {pricingMode === 'fixed' && (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          step="0.5"
                          value={fixedPriceValue}
                          onChange={(e) => setFixedPriceValue(e.target.value)}
                          className="w-24 bg-neutral-900 border border-emerald-500 rounded p-1 text-white font-bold text-xs"
                        />
                        <span className="text-neutral-300 font-bold">€</span>
                      </div>
                    )}
                  </label>

                  <label className={`p-3.5 border rounded-xl cursor-pointer flex flex-col justify-between gap-2 transition ${pricingMode === 'margin_fixed' ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-950'}`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="pricingMode" 
                        checked={pricingMode === 'margin_fixed'} 
                        onChange={() => setPricingMode('margin_fixed')} 
                        className="text-emerald-500"
                      />
                      <span className="font-bold text-white">Coste + Margen Fijo</span>
                    </div>
                    <p className="text-neutral-400 text-[11px]">Coste del proveedor + beneficio fijo en euros por cada camiseta.</p>
                    {pricingMode === 'margin_fixed' && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-neutral-400 text-[11px]">Coste +</span>
                        <input
                          type="number"
                          step="0.5"
                          value={marginAddValue}
                          onChange={(e) => setMarginAddValue(e.target.value)}
                          className="w-20 bg-neutral-900 border border-emerald-500 rounded p-1 text-white font-bold text-xs"
                        />
                        <span className="text-neutral-300 font-bold">€</span>
                      </div>
                    )}
                  </label>

                  <label className={`p-3.5 border rounded-xl cursor-pointer flex flex-col justify-between gap-2 transition ${pricingMode === 'csv_price' ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-950'}`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="pricingMode" 
                        checked={pricingMode === 'csv_price'} 
                        onChange={() => setPricingMode('csv_price')} 
                        className="text-emerald-500"
                      />
                      <span className="font-bold text-white">Precio Directo del CSV</span>
                    </div>
                    <p className="text-neutral-400 text-[11px]">Usa exactamente el precio que tenga la columna de venta del archivo.</p>
                    {pricingMode === 'csv_price' && (
                      <span className="text-emerald-400 text-[10px] font-semibold">Usando columna seleccionada</span>
                    )}
                  </label>

                </div>
              </div>

              {/* Additional Options */}
              <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/40 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label htmlFor="csv-default-section" className="font-semibold text-neutral-300 block mb-1">
                    Categoría por defecto (si no se detecta liga)
                  </label>
                  <select
                    id="csv-default-section"
                    value={defaultSection}
                    onChange={(e) => setDefaultSection(e.target.value as CatalogSection)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-white"
                  >
                    {CATALOG_SECTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="csv-supplier-name" className="font-semibold text-neutral-300 block mb-1">
                    Nombre del Proveedor (referencia interna)
                  </label>
                  <input
                    id="csv-supplier-name"
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Ej: Mayorista Directo, Proveedor A, Almacén Central"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 rounded-xl text-xs font-semibold transition"
                >
                  Volver a subir
                </button>
                <button
                  type="button"
                  onClick={generatePreview}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  Ver Vista Previa ({rawRows.length} camisetas) <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: PREVIEW & CONFIRM */}
          {step === 'preview' && (
            <div className="space-y-4">
              
              {/* Summary toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-900/60 p-3.5 border border-neutral-800 rounded-xl text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold text-neutral-200 transition"
                  >
                    {selectedCount === previewProducts.length ? 'Desmarcar todas' : 'Marcar todas'}
                  </button>
                  <span className="text-neutral-300">
                    <strong className="text-emerald-400 font-bold text-sm">{selectedCount}</strong> de {previewProducts.length} camisetas seleccionadas
                  </span>
                </div>

                {/* Replace vs Append switch */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded border-neutral-700 text-rose-500 focus:ring-rose-500"
                    />
                    <span>Reemplazar catálogo actual ({currentProductCount} existentes)</span>
                  </label>
                </div>
              </div>

              {/* Items List Preview */}
              <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 max-h-[50vh] overflow-y-auto divide-y divide-neutral-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/80 sticky top-0 text-neutral-400 font-semibold uppercase text-[10px] tracking-wider z-10">
                    <tr>
                      <th className="p-3 w-10">Sel.</th>
                      <th className="p-3 w-16">Foto</th>
                      <th className="p-3">Camiseta / Título</th>
                      <th className="p-3">Categoría / Liga</th>
                      <th className="p-3 text-right">PVP Clientes</th>
                      <th className="p-3 text-right">Coste</th>
                      <th className="p-3">Tallas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {previewProducts.map((prod) => (
                      <tr 
                        key={prod.id} 
                        onClick={() => handleToggleSelect(prod.id)}
                        className={`cursor-pointer transition hover:bg-neutral-900/50 ${selectedIds[prod.id] ? 'bg-neutral-900/20' : 'opacity-40'}`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedIds[prod.id])}
                            onChange={() => handleToggleSelect(prod.id)}
                            className="rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              className="w-12 h-12 object-cover rounded-lg border border-neutral-800 bg-neutral-900"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600">
                              <Shirt className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-white">
                          <p className="line-clamp-2">{prod.title}</p>
                          {prod.itemCode && (
                            <span className="text-[10px] text-neutral-500 font-mono">Ref: {prod.itemCode}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-medium border border-neutral-700">
                            {prod.section}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-400">
                          {prod.price.toFixed(2)} €
                        </td>
                        <td className="p-3 text-right text-neutral-400 font-mono text-[11px]">
                          {prod.costPrice ? `${prod.costPrice.toFixed(2)} €` : '-'}
                        </td>
                        <td className="p-3 text-neutral-400 text-[10px]">
                          {prod.availableSizes?.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Final Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 rounded-xl text-xs font-semibold transition"
                >
                  Volver a configurar
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishImport}
                    disabled={selectedCount === 0}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xl shadow-emerald-500/25"
                  >
                    <Check className="w-4 h-4" />
                    Confirmar e Importar {selectedCount} Camisetas
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
