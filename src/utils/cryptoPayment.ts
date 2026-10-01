export async function createNowpaymentsInvoice({
  orderId,
  amountEur,
  orderDescription,
}: {
  orderId: string;
  amountEur: number;
  orderDescription?: string;
}) {
  const apiKey =
    import.meta.env.VITE_NOWPAYMENTS_API_KEY ||
    'DYAKTRZ-G8YM59A-JHHK2VM-MSR9CVZ';

  const res = await fetch('https://api.nowpayments.io/v1/invoice', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: Number(amountEur.toFixed(2)),
      price_currency: 'eur',
      order_id: orderId,
      order_description: orderDescription || `Pedido KitsHub #${orderId}`,
      ipn_callback_url: 'https://kitshub.es/api/crypto-webhook',
      success_url: `${window.location.origin}/`,
      cancel_url: window.location.href,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.invoice_url) {
    throw new Error(data.message || 'Error al generar la pasarela cripto');
  }

  return data.invoice_url as string;
}