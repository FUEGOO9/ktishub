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
  value: number; // percentage (e.g. 20 for 20%) or fixed amount (e.g. 5 for 5€)
  label: string;
  description: string;
}

export const STORAGE_KEY_COUPONS = 'kitshub_admin_coupons_v1';

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

export function saveCustomCoupons(coupons: Record<string, PromoCodeDefinition>) {
  try {
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(coupons));
  } catch (e) {
    console.error('Error saving custom coupons:', e);
  }
}

/**
 * Validates and calculates discount on a given price using custom admin coupons.
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
}
