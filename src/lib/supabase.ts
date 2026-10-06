const SUPABASE_URL = 'https://uisoufrfskimwbyrnijn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6zCRsj18wqsG5ZwgkLLLXg_P4kcBRIb';

// Obtener todos los cupones activos
export async function getActiveCoupons() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/coupons?is_active=eq.true&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('Error al cargar cupones de Supabase:', e);
    return [];
  }
}

// Guardar un nuevo cupón
export async function saveCouponToSupabase(coupon: {
  code: string;
  discount_type: string;
  discount_value: number;
  description?: string;
}) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/coupons`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ...coupon,
        is_active: true
      })
    });
    return res.ok;
  } catch (e) {
    console.error('Error al guardar cupón en Supabase:', e);
    return false;
  }
}

// Borrar o desactivar un cupón
export async function deleteCouponFromSupabase(code: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(code)}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    return res.ok;
  } catch (e) {
    console.error('Error al borrar cupón en Supabase:', e);
    return false;
  }
}