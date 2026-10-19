import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { order } = req.body;

    if (!order || !order.customer?.email) {
      return res.status(400).json({ error: 'Faltan datos del pedido o el email' });
    }

    const itemsHtml = order.items.map((item: any) => {
        const title = item.product?.title || item.title || 'Camiseta de fútbol';
        const size = item.selectedSize || item.size || 'M';
        const itemTotal = (Number(item.product?.price ?? item.price ?? 0) * item.quantity).toFixed(2);
        
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${title}</strong> (Talla: ${size})</td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${itemTotal} €</td>
          </tr>
        `;
    }).join('');

    const totalFormatted = (order.total || order.totalAmount || 0).toFixed(2) + ' €';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">¡Pago confirmado!</h1>
        </div>
        <div style="padding: 20px; color: #333;">
          <p>Hola <strong>${order.customer.name || 'Cliente'}</strong>,</p>
          <p>Hemos recibido correctamente tu pago. Tu pedido <strong>#${order.id}</strong> ya está en proceso de preparación.</p>
          
          <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Resumen de tu pedido</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total pagado:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; color: #10b981;">${totalFormatted}</td>
            </tr>
          </table>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0;"><strong>Dirección de envío:</strong></p>
            <p style="margin: 5px 0 0 0;">${order.customer.address}, ${order.customer.postalCode} ${order.customer.city}</p>
          </div>
          
          <p style="margin-top: 30px; text-align: center; color: #666;">Gracias por confiar en <strong>Kitshub</strong>.</p>
        </div>
      </div>
    `;

    const data = await resend.emails.send({
      from: 'Kitshub <onboarding@resend.dev>',
      to: [order.customer.email],
      subject: `¡Pago recibido! Confirmación de tu pedido #${order.id}`,
      html: emailHtml,
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al enviar el correo' });
  }
}