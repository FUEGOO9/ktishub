import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { price_amount, price_currency, order_id, order_description } = req.body;
  const apiKey = process.env.NOWPAYMENTS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta NOWPAYMENTS_API_KEY en las variables de entorno' });
  }

  try {
    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount,
        price_currency: price_currency || 'eur',
        order_id: String(order_id),
        order_description: order_description || 'Pedido KitsHub',
        success_url: `https://www.kitshub.es/?payment_status=success&order_id=${order_id}`,
        cancel_url: `https://www.kitshub.es/?payment_status=cancel&order_id=${order_id}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Error al contactar con NOWPayments' });
  }
}