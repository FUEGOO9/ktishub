export interface DiscountResult {
  isValid: boolean;
  code: string;
  label: string;
  type: 'percentage' | 'fixed';
  percentage: number;
  discountAmount: number;
  finalPrice: number;
  message: string;
}

export interface PromoCodeDefinition {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  label: string;
  description: string;
}

export const STORAGE_KEY_COUPONS = 'kitshub_admin_coupons_v1';

const SUPABASE_URL = 'https://uisoufrfskimwbyrnijn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6zCRsj18wqsG5ZwgkLLLXg_P4kcBRIb';

// Obtener cupones de la caché local instantánea
export function getCustomCoupons(): Record<string, PromoCodeDefinition> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COUPONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading custom coupons:', e);
  }
  return {};
}

// Guardar en la caché local
export function saveCustomCoupons(coupons: Record<string, PromoCodeDefinition>) {
  try {
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(coupons));
  } catch (e) {
    console.error('Error saving custom coupons:', e);
  }
}

// Cargar cupones desde Supabase y actualizar la memoria local
export async function fetchCouponsFromCloud(): Promise<Record<string, PromoCodeDefinition>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/coupons?is_active=eq.true&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) return getCustomCoupons();

    const rows = await res.json();
    const map: Record<string, PromoCodeDefinition> = {};

    rows.forEach((row: any) => {
      const isPercent = (row.discount_type || 'percentage') === 'percentage';
      const val = Number(row.discount_value);
      map[row.code] = {
        code: row.code,
        type: isPercent ? 'percentage' : 'fixed',
        value: val,
        label: isPercent ? `${val}% OFF` : `${val.toFixed(2)} € OFF`,
        description: row.description || `Cupón promocional ${row.code}`
      };
    });

    saveCustomCoupons(map);
    return map;
  } catch (e) {
    console.error('Error fetching coupons from Supabase:', e);
    return getCustomCoupons();
  }
}

// Guardar cupón en Supabase
export async function saveCouponToCloud(coupon: PromoCodeDefinition): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/coupons`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        code: coupon.code.toUpperCase(),
        discount_type: coupon.type,
        discount_value: coupon.value,
        description: coupon.description,
        is_active: true
      })
    });

    if (res.ok) {
      const local = getCustomCoupons();
      local[coupon.code] = coupon;
      saveCustomCoupons(local);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error saving coupon to Supabase:', e);
    return false;
  }
}

// Eliminar cupón de Supabase
export async function deleteCouponFromCloud(code: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(code)}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (res.ok) {
      const local = getCustomCoupons();
      delete local[code];
      saveCustomCoupons(local);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error deleting coupon from Supabase:', e);
    return false;
  }
}

/**
 * Valida y calcula el descuento
 */
export function evaluateDiscount(originalPrice: number, rawCode: string): DiscountResult {
  const code = (rawCode || '').trim().toUpperCase();

  if (!code) {
    return {
      isValid: false,
      code: '',
      label: '',
      type: 'percentage',
      percentage: 0,
      discountAmount: 0,
      finalPrice: Math.max(0, originalPrice),
      message: '',
    };
  }

  // Comprobación de cupones maestros
  if (code === '100DESCUENTO' || code === 'PROMO100') {
    return {
      isValid: true,
      code,
      label: '100% OFF',
      type: 'percentage',
      percentage: 100,
      discountAmount: originalPrice,
      finalPrice: 0,
      message: `¡Cupón ${code} aplicado! Ahorras ${originalPrice.toFixed(2)} € (100% OFF)`,
    };
  }

  const coupons = getCustomCoupons();
  if (coupons[code]) {
    const promo = coupons[code];
    let discount = 0;
    let percent = 0;

    if (promo.type === 'percentage') {
      percent = promo.value;
      discount = (originalPrice * promo.value) / 100;
    } else {
      discount = Math.min(originalPrice, promo.value);
      percent = originalPrice > 0 ? Math.round((discount / originalPrice) * 100) : 0;
    }

    const final = Math.max(0, originalPrice - discount);
    return {
      isValid: true,
      code: promo.code,
      label: promo.label || `${percent}% OFF`,
      type: promo.type,
      percentage: percent,
      discountAmount: discount,
      finalPrice: final,
      message: `¡Cupón ${promo.code} aplicado! Ahorras ${discount.toFixed(2)} € (${percent}% OFF)`,
    };
  }

  return {
    isValid: false,
    code,
    label: '',
    type: 'percentage',
    percentage: 0,
    discountAmount: 0,
    finalPrice: originalPrice,
    message: 'Código de descuento no válido o no existe.',
  };