import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    const invoices = await base44.entities.Invoice.filter({ id: invoiceId });
    const invoice = invoices[0];

    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.professional_id !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const itemsHTML = invoice.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.unit_price.toFixed(2)}€</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.total.toFixed(2)}€</td>
      </tr>
    `).join('');

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; }
          .container { max-width: 700px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); padding: 40px 30px; }
          .header h1 { margin: 0 0 8px; color: white; font-size: 32px; font-weight: 700; }
          .header p { margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 18px; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 16px; color: #1f2937; margin-bottom: 20px; line-height: 1.6; }
          .info-grid { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 25px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #6b7280; font-weight: 500; font-size: 14px; }
          .info-value { color: #1f2937; font-weight: 600; font-size: 14px; }
          .section-title { color: #1f2937; font-size: 20px; font-weight: 700; margin: 30px 0 15px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f3f4f6; padding: 14px; text-align: left; font-weight: 600; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 14px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; }
          .total-section { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 25px; margin: 30px 0; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; }
          .total-row.final { padding-top: 15px; margin-top: 15px; border-top: 2px solid #2563eb; }
          .total-row.final .label { font-size: 20px; font-weight: 700; color: #1e40af; }
          .total-row.final .value { font-size: 28px; font-weight: 700; color: #1e40af; }
          .notes { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .notes strong { color: #92400e; display: block; margin-bottom: 8px; }
          .notes p { color: #78350f; margin: 0; line-height: 1.6; }
          .footer-msg { background: #f0f9ff; padding: 25px; border-radius: 12px; margin-top: 30px; text-align: center; }
          .footer-msg p { margin: 5px 0; color: #0c4a6e; font-size: 15px; }
          .footer-msg .signature { font-weight: 600; color: #075985; margin-top: 15px; font-size: 16px; }
          .footer { background: #f9fafb; padding: 25px 30px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Factura</h1>
            <p>${invoice.invoice_number}</p>
          </div>
          <div class="content">
            <div class="greeting">
              <p>Estimado/a <strong>${invoice.client_name}</strong>,</p>
              <p>Le adjuntamos la factura con los detalles de nuestros servicios.</p>
            </div>
            
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">📅 Fecha de emisión</span>
                <span class="info-value">${new Date(invoice.issue_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">⏰ Fecha de vencimiento</span>
                <span class="info-value">${new Date(invoice.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">👤 Cliente</span>
                <span class="info-value">${invoice.client_name}</span>
              </div>
            </div>

            <h2 class="section-title">📋 Detalle de servicios</h2>
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: right;">Precio unitario</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row">
                <span class="label">Subtotal</span>
                <span class="value">${invoice.subtotal.toFixed(2)}€</span>
              </div>
              <div class="total-row">
                <span class="label">IVA (${invoice.iva_percentage}%)</span>
                <span class="value">${invoice.iva_amount.toFixed(2)}€</span>
              </div>
              <div class="total-row final">
                <span class="label">TOTAL A PAGAR</span>
                <span class="value">${invoice.total.toFixed(2)}€</span>
              </div>
            </div>

            ${invoice.notes ? `
              <div class="notes">
                <strong>📝 Notas importantes</strong>
                <p>${invoice.notes}</p>
              </div>
            ` : ''}
            
            <div class="footer-msg">
              <p>✨ Gracias por confiar en nuestros servicios</p>
              <p class="signature">Atentamente,<br><strong>${user.full_name || user.email}</strong></p>
            </div>
          </div>
          <div class="footer">
            <p>MisAutónomos · Sistema de facturación profesional</p>
            <p style="margin-top: 8px; color: #9ca3af;">Este es un email automático con tu factura adjunta.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await base44.integrations.Core.SendEmail({
      to: invoice.client_email,
      subject: `Factura ${invoice.invoice_number}`,
      body: emailBody
    });

    await base44.entities.Invoice.update(invoice.id, {
      status: 'sent'
    });

    return Response.json({ 
      success: true,
      message: 'Invoice sent successfully'
    });

  } catch (error) {
    console.error('Error sending invoice:', error);
    return Response.json({ 
      error: error.message || 'Error sending invoice' 
    }, { status: 500 });
  }
});