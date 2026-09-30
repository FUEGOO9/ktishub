export type CatalogSection = 
  | 'Populares'
  | 'Temporada 26/27'
  | 'Temporada 25/26'
  | 'Retro'
  | 'Mundial 2026'
  | 'Mundial'
  | 'LaLiga'
  | 'Premier League'
  | 'Serie A'
  | 'Bundesliga'
  | 'Ligue 1'
  | 'Brasileirão'
  | 'Liga ARG & Sudamericana'
  | 'Liga Profesional ARG'
  | 'Liga Chilena'
  | 'Primeira Liga'
  | 'Eredivisie'
  | 'Liga MX'
  | 'MLS'
  | 'Liga Escocesa'
  | 'Japon League'
  | 'Conjuntos Especiales'
  | 'Ropa Entrenamiento & Cortavientos'
  | 'Ropa de Moda'
  | 'Unboxing';

export type ProductType = 
  | 'Camiseta 26/27'
  | 'Camiseta 25/26'
  | 'Camiseta Retro'
  | 'Conjunto Especial / Pack'
  | 'Unboxing / Review Calidad'
  | 'Cortavientos / Chándal'
  | 'Ropa de Moda / Streetwear'
  | 'Zapatillas / Calzado'
  | 'Otro';

export type ProviderPlatform = 
  | 'Yupoo'
  | 'Zhidian'
  | 'Weidian'
  | 'Taobao'
  | '1688'
  | 'DHgate'
  | 'WhatsApp / Directo'
  | 'Otro';

export type JerseyEdition = 'FAN VERSION' | 'PLAYER VERSION';

export interface Product {
  id: string;
  title: string;
  section: CatalogSection;
  sections?: CatalogSection[];
  category?: ProductType;
  supplierName?: string;
  price: number; // Retail price to customer in € (0 means 'Por definir')
  originalPrice?: number; // Previous/comparison price in € before discount
  costPrice?: number; // Cost price from supplier in € (PRIVATE: only visible to store admin)
  url?: string;
  password?: string;
  provider?: ProviderPlatform;
  imageUrl?: string;
  images?: string[];
  clubColors?: {
    primary: string;
    secondary: string;
  };
  team?: string;
  season?: string;
  player?: string;
  presetPlayers?: string[];
  allowCustomDorsal?: boolean;
  availableEditions?: JerseyEdition[];
  fanVersionDescription?: string;
  playerVersionDescription?: string;
  playerVersionExtraPrice?: number;
  dorsalExtraPrice?: number;
  isRetro?: boolean;
  isStoreItem?: boolean;
  isPopular?: boolean;
  badgeOptions?: string[];
  notes?: string;
  description?: string;
  availableSizes?: string[];
  sizes?: string[];
  qualityGrade?: string;
  itemCode?: string;
  featured?: boolean;
  inStock?: boolean;
  supplierUrl?: string;
  unboxingVideoUrl?: string;
  customerReviewScore?: number;
  createdAt?: string;
  dateAdded?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  label?: string;
  description?: string;
  minSpend?: number;
  maxUses?: number;
  expiresAt?: string;
  active?: boolean;
  usageCount?: number;
  createdAt?: string;
}

export interface CartItem {
  id?: string;
  product: Product;
  selectedSize: string;
  selectedEdition?: JerseyEdition;
  size?: string;
  edition?: JerseyEdition;
  price?: number;
  quantity: number;
  customization?: {
    name?: string;
    number?: string;
    patch?: string;
    dorsalMode?: 'none' | 'player' | 'custom';
  };
  discountCode?: string;
  discountPercent?: number;
  discountAmount?: number;
  originalPrice?: number;
}

export type PaymentMethod = 'card' | 'klarna' | 'paypal' | 'crypto';

export interface PaymentSettings {
  stripeEnabled: boolean;
  stripePaymentLink?: string;
  klarnaEnabled: boolean;
  paypalEmail: string;
  paypalMeUsername?: string;
  acceptPaypal: boolean;
  usdtTrc20Address: string;
  btcAddress: string;
  ethAddress: string;
  acceptCrypto: boolean;
  bankIban?: string;
  acceptCard: boolean;
  adminPin: string;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  stripeEnabled: true,
  stripePaymentLink: '',
  klarnaEnabled: true,
  paypalEmail: 'elfuegodelawwe@gmail.com',
  paypalMeUsername: '',
  usdtTrc20Address: '',
  btcAddress: '',
  ethAddress: '',
  bankIban: '',
  acceptCard: true,
  acceptPaypal: false,
  acceptCrypto: false,
  adminPin: '$hjL$g}Z)%Z7.$pD',
};

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  countryPrefix?: string;
  country?: string;
  address: string;
  city: string;
  postalCode: string;
  province?: string;
  notes?: string;
}

export interface Order {
  id: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  shipping?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'verified';
  orderStatus?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  carrier?: string;
  internalNotes?: string;
  cryptoCurrency?: string;
  cryptoTxId?: string;
  paypalAccountEmail?: string;
  date: string;
  createdAt?: string;
  estimatedDelivery?: string;
}

// =========================================================================
// TARIFAS DE ENVÍO INTERNACIONAL & ARANCELES UE
// - Menos de 3 productos (< 3): 
//     * Desde la UE: 7 € (4 € base + 3 € nuevos aranceles aduaneros UE)
//     * Desde fuera de la UE: 4 €
// - 3 o más productos (>= 3): ¡GRATIS (0 €)!
// =========================================================================

export const EU_COUNTRY_CODES = new Set([
  'ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'AT', 'IE', 'SE', 'DK', 'PL', 
  'GR', 'FI', 'CZ', 'RO', 'HU', 'SK', 'BG', 'HR', 'CY', 'EE', 'LV', 'LT', 'LU', 'MT', 'SI'
]);

export const EU_COUNTRY_NAMES = new Set([
  'España', 'Francia', 'Alemania', 'Italia', 'Portugal', 'Países Bajos', 'Bélgica',
  'Austria', 'Irlanda', 'Suecia', 'Dinamarca', 'Polonia', 'Grecia', 'Finlandia',
  'República Checa', 'Rumanía', 'Hungría', 'Eslovaquia', 'Bulgaria', 'Croacia',
  'Chipre', 'Estonia', 'Letonia', 'Lituania', 'Luxemburgo', 'Malta', 'Eslovenia',
  'Spain', 'France', 'Germany', 'Italy', 'Netherlands', 'Belgium', 'Austria', 'Ireland',
  'Sweden', 'Denmark', 'Poland', 'Greece', 'Finland'
]);

export function isEUCountry(countryNameOrCode?: string): boolean {
  if (!countryNameOrCode) return true; // Default to Spain / EU
  const trimmed = countryNameOrCode.trim();
  if (EU_COUNTRY_CODES.has(trimmed.toUpperCase())) return true;
  if (EU_COUNTRY_NAMES.has(trimmed)) return true;
  for (const name of EU_COUNTRY_NAMES) {
    if (name.toLowerCase() === trimmed.toLowerCase()) return true;
  }
  return false;
}

export function calculateShippingInfo(totalItemsCount: number, country?: string) {
  if (totalItemsCount === 0) {
    return {
      shippingCost: 0,
      isFree: true,
      isEU: true,
      baseCost: 0,
      tariffCost: 0,
      label: '0,00 €',
      badge: 'Cesta vacía',
    };
  }

  const inEU = isEUCountry(country);

  if (totalItemsCount >= 3) {
    return {
      shippingCost: 0,
      isFree: true,
      isEU: inEU,
      baseCost: 0,
      tariffCost: 0,
      label: 'GRATIS',
      badge: 'Envío GRATIS (3+ artículos)',
    };
  }

  if (inEU) {
    return {
      shippingCost: 7.00,
      isFree: false,
      isEU: true,
      baseCost: 4.00,
      tariffCost: 3.00,
      label: '7,00 €',
      badge: '7,00 € (4€ base + 3€ aranceles UE)',
    };
  } else {
    return {
      shippingCost: 4.00,
      isFree: false,
      isEU: false,
      baseCost: 4.00,
      tariffCost: 0.00,
      label: '4,00 €',
      badge: '4,00 € (Tarifa internacional fuera UE)',
    };
  }
}
