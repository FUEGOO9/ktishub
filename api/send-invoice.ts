import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { order } = req.body;

    if (!order || !order.customer?.email) {
      return res.status(400).json({ error: 'Faltan datos del pedido o el email del cliente' });
    }

    const orderDate = new Date(order.date || order.createdAt || Date.now()).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const itemsHtml = order.items
      .map((item: any) => {
        const title = item.product?.title || item.title || 'Camiseta de fútbol';
        const size = item.selectedSize || item.size || 'M';
        const patch = item.selectedPatch || item.patch || null;
        const edition = item.selectedEdition || item.edition || null;
        const dorsal = item.customDorsal ? `${item.customDorsal.number || ''} ${item.customDorsal.name || ''}`.trim() : null;
        
        const unitPrice = Number(item.product?.price ?? item.price ?? 0);
        const itemTotal = (unitPrice * item.quantity).toFixed(2);

        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 14px 12px; text-align: left; vertical-align: top; color: #374151; font-size: 13px; line-height: 1.6;">
              <strong style="color: #111827; font-size: 14px;">${title} - ${size}</strong><br/>
              <span style="color: #4b5563;"><strong>TALLA:</strong> ${size}</span><br/>
              ${patch ? `<span style="color: #4b5563;"><strong>Parches:</strong> ${patch}</span><br/>` : ''}
              ${edition ? `<span style="color: #4b5563;"><strong>Versión camiseta:</strong> ${edition}</span><br/>` : ''}
              ${dorsal ? `<span style="color: #4b5563;"><strong>Personalización:</strong> ${dorsal}</span>` : ''}
            </td>
            <td style="padding: 14px 12px; text-align: center; vertical-align: top; color: #374151; font-size: 13px;">
              ${item.quantity}
            </td>
            <td style="padding: 14px 12px; text-align: right; vertical-align: top; color: #374151; font-size: 13px; font-weight: 500;">
              ${itemTotal} €
            </td>
          </tr>
        `;
      })
      .join('');

    const subtotalFormatted = (order.subtotal || 0).toFixed(2) + ' €';
    const discountFormatted = order.discountAmount && order.discountAmount > 0 ? `-${order.discountAmount.toFixed(2)} €` : null;
    const shippingFormatted = !order.shippingCost || order.shippingCost === 0 ? 'Envío gratuito' : `${order.shippingCost.toFixed(2)} €`;
    const totalFormatted = (order.total || order.totalAmount || 0).toFixed(2) + ' €';

    const customerAddress = order.customer.address || '';
    const customerCity = order.customer.city || '';
    const customerPostal = order.customer.postalCode || '';
    const customerCountry = order.customer.country || 'España';
    const customerPhone = order.customer.phone || '';

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Confirmación de pedido</title>
      </head>
      <body style="margin: 0; padding: 20px 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background-color: #23282d; padding: 36px 32px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Gracias por tu pedido</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 16px 32px; color: #4b5563; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 16px 0;">Hola ${order.customer.name || 'Cliente'},</p>
              <p style="margin: 0 0 24px 0;">Hemos recibido correctamente tu pedido #${order.id} y lo estamos procesando:</p>
              <h2 style="font-size: 17px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">[Pedido #${order.id}] (${orderDate})</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background-color: #fafafa; border-bottom: 1px solid #e5e7eb;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 13px; font-weight: 700; color: #374151;">Producto</th>
                    <th style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 700; color: #374151; width: 70px;">Cantidad</th>
                    <th style="padding: 10px 12px; text-align: right; font-size: 13px; font-weight: 700; color: #374151; width: 90px;">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td colspan="2" style="padding: 10px 12px; text-align: left; font-size: 13px; font-weight: 700; color: #374151;">Subtotal:</td>
                    <td style="padding: 10px 12px; text-align: right; font-size: 13px; color: #374151;">${subtotalFormatted}</td>
                  </tr>
                  ${discountFormatted ? `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td colspan="2" style="padding: 10px 12px; text-align: left; font-size: 13px; font-weight: 700; color: #374151;">Descuento:</td>
                    <td style="padding: 10px 12px; text-align: right; font-size: 13px; color: #16a34a; font-weight: 600;">${discountFormatted}</td>
                  </tr>` : ''}
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td colspan="2" style="padding: 10px 12px; text-align: left; font-size: 13px; font-weight: 700; color: #374151;">Envío:</td>
                    <td style="padding: 10px 12px; text-align: right; font-size: 13px; color: #374151;">${shippingFormatted}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td colspan="2" style="padding: 12px; text-align: left; font-size: 14px; font-weight: 700; color: #111827;">Total:</td>
                    <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: 700; color: #111827;">${totalFormatted}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 10px 12px; text-align: left; font-size: 13px; font-weight: 700; color: #374151;">Método de pago:</td>
                    <td style="padding: 10px 12px; text-align: right; font-size: 13px; color: #374151;">${(order.paymentMethod || 'Tarjeta / Cripto').toUpperCase()}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 32px 32px 32px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="48%" style="vertical-align: top;">
                    <h3 style="font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 10px 0;">Dirección de facturación</h3>
                    <div style="border: 1px solid #e5e7eb; padding: 14px; font-size: 13px; line-height: 1.6; color: #4b5563;">
                      <em>${order.customer.name || ''}</em><br/>
                      <span style="color: #2563eb; text-decoration: underline;">${customerAddress}</span><br/>
                      ${customerPostal} ${customerCity}<br/>
                      ${customerCountry}<br/>
                      <span style="text-decoration: underline;">${customerPhone}</span><br/>
                      <span style="color: #2563eb; text-decoration: underline;">${order.customer.email}</span>
                    </div>
                  </td>
                  <td width="4%">&nbsp;</td>
                  <td width="48%" style="vertical-align: top;">
                    <h3 style="font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 10px 0;">Dirección de envío</h3>
                    <div style="border: 1px solid #e5e7eb; padding: 14px; font-size: 13px; line-height: 1.6; color: #4b5563;">
                      <em>${order.customer.name || ''}</em><br/>
                      <span style="color: #2563eb; text-decoration: underline;">${customerAddress}</span><br/>
                      ${customerPostal} ${customerCity}<br/>
                      ${customerCountry}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #fafafa; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
              <p style="margin: 0 0 4px 0;">¡Gracias por comprar en <strong>Kitshub</strong>!</p>
              <p style="margin: 0;">Kitshub — Todos los derechos reservados</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: 'Kitshub <onboarding@resend.dev>',
      to: [order.customer.email],
      subject: `[Kitshub] Tu pedido #${order.id} se ha recibido correctamente`,
      html: emailHtml,
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error al enviar email:', error);
    return res.status(500).json({ error: error.message || 'Error al enviar el correo' });
  }
}