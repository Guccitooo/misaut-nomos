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
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #1d4ed8; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 20px; border: 1px solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
          .total-row { font-weight: bold; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Factura ${invoice.invoice_number}</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${invoice.client_name},</p>
            <p>Adjuntamos la factura <strong>${invoice.invoice_number}</strong> con los siguientes detalles:</p>
            
            <table>
              <tr>
                <td><strong>Fecha de emisión:</strong></td>
                <td>${new Date(invoice.issue_date).toLocaleDateString('es-ES')}</td>
              </tr>
              <tr>
                <td><strong>Fecha de vencimiento:</strong></td>
                <td>${new Date(invoice.due_date).toLocaleDateString('es-ES')}</td>
              </tr>
              <tr>
                <td><strong>Cliente:</strong></td>
                <td>${invoice.client_name}</td>
              </tr>
            </table>

            <h3>Conceptos</h3>
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

            <table style="width: 300px; margin-left: auto;">
              <tr>
                <td><strong>Subtotal:</strong></td>
                <td style="text-align: right;">${invoice.subtotal.toFixed(2)}€</td>
              </tr>
              <tr>
                <td><strong>IVA (${invoice.iva_percentage}%):</strong></td>
                <td style="text-align: right;">${invoice.iva_amount.toFixed(2)}€</td>
              </tr>
              <tr class="total-row">
                <td style="padding: 12px;"><strong>TOTAL:</strong></td>
                <td style="padding: 12px; text-align: right; font-size: 1.2em;">${invoice.total.toFixed(2)}€</td>
              </tr>
            </table>

            ${invoice.notes ? `<p><strong>Notas:</strong> ${invoice.notes}</p>` : ''}
            
            <p style="margin-top: 30px;">Gracias por su confianza.</p>
            <p>Atentamente,<br>${user.full_name || user.email}</p>
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