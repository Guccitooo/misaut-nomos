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

    if (invoice.professional_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const daysOverdue = invoice.due_date 
      ? Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24))
      : 0;

    let subject, body;
    
    if (daysOverdue > 0) {
      subject = `⚠️ Recordatorio urgente: Factura ${invoice.invoice_number} vencida`;
      body = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
            .header p { margin: 10px 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; }
            .content { padding: 40px 30px; }
            .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .alert-box p { margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6; }
            .alert-box strong { display: block; font-size: 18px; margin-bottom: 8px; }
            .info-box { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 25px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .info-label { color: #6b7280; font-weight: 500; }
            .info-value { color: #1f2937; font-weight: 600; }
            .total-highlight { background: linear-gradient(135deg, #fef3c7 0%, #fde047 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0; }
            .total-highlight .amount { font-size: 36px; font-weight: 700; color: #92400e; margin: 10px 0; }
            .btn { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 20px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
            .footer { background: #f9fafb; padding: 25px 30px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Pago Vencido</h1>
              <p>Factura ${invoice.invoice_number}</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>⏰ Factura vencida hace ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'}</strong>
                <p>Estimado/a <strong>${invoice.client_name}</strong>, su factura se encuentra vencida. Le solicitamos que proceda con el pago a la mayor brevedad posible.</p>
              </div>
              
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">📄 Número de factura</span>
                  <span class="info-value">${invoice.invoice_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">📅 Fecha de emisión</span>
                  <span class="info-value">${new Date(invoice.issue_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">⏰ Fecha de vencimiento</span>
                  <span class="info-value" style="color: #dc2626; font-weight: 700;">${new Date(invoice.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div class="total-highlight">
                <p style="margin: 0; color: #78350f; font-size: 14px; font-weight: 600;">IMPORTE TOTAL PENDIENTE</p>
                <div class="amount">${invoice.total.toFixed(2)}€</div>
              </div>

              ${invoice.payment_link ? `
                <div style="text-align: center;">
                  <p style="color: #1f2937; margin-bottom: 15px;">Puede realizar el pago de forma rápida y segura:</p>
                  <a href="${invoice.payment_link}" class="btn">💳 Pagar Ahora →</a>
                </div>
              ` : ''}

              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <p style="margin: 0; color: #075985; font-size: 14px; line-height: 1.6;">Si ya ha realizado el pago, por favor ignore este mensaje. Si tiene alguna consulta, no dude en contactarnos.</p>
              </div>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Saludos cordiales,<br><strong style="color: #1f2937;">${user.full_name || 'El equipo'}</strong></p>
            </div>
            <div class="footer">
              <p>MisAutónomos · Sistema de facturación profesional</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = `🔔 Recordatorio: Factura ${invoice.invoice_number} pendiente de pago`;
      body = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
            .header p { margin: 10px 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; }
            .content { padding: 40px 30px; }
            .reminder-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .reminder-box p { margin: 0; color: #78350f; font-size: 15px; line-height: 1.6; }
            .info-box { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 25px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .info-label { color: #6b7280; font-weight: 500; }
            .info-value { color: #1f2937; font-weight: 600; }
            .total-highlight { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0; }
            .total-highlight .amount { font-size: 36px; font-weight: 700; color: #1e40af; margin: 10px 0; }
            .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 20px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
            .footer { background: #f9fafb; padding: 25px 30px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Recordatorio de Pago</h1>
              <p>Factura ${invoice.invoice_number}</p>
            </div>
            <div class="content">
              <div class="reminder-box">
                <p>Estimado/a <strong>${invoice.client_name}</strong>, le recordamos amablemente que tiene pendiente el pago de la siguiente factura.</p>
              </div>
              
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">📄 Número de factura</span>
                  <span class="info-value">${invoice.invoice_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">📅 Fecha de emisión</span>
                  <span class="info-value">${new Date(invoice.issue_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">⏰ Fecha de vencimiento</span>
                  <span class="info-value">${new Date(invoice.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div class="total-highlight">
                <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">IMPORTE TOTAL</p>
                <div class="amount">${invoice.total.toFixed(2)}€</div>
              </div>

              ${invoice.payment_link ? `
                <div style="text-align: center;">
                  <p style="color: #1f2937; margin-bottom: 15px;">Puede realizar el pago de forma rápida y segura:</p>
                  <a href="${invoice.payment_link}" class="btn">💳 Pagar Ahora →</a>
                </div>
              ` : ''}

              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <p style="margin: 0; color: #075985; font-size: 14px; line-height: 1.6;">Si ya ha realizado el pago, por favor ignore este mensaje. Gracias por su confianza.</p>
              </div>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Saludos cordiales,<br><strong style="color: #1f2937;">${user.full_name || 'El equipo'}</strong></p>
            </div>
            <div class="footer">
              <p>MisAutónomos · Sistema de facturación profesional</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    await base44.integrations.Core.SendEmail({
      to: invoice.client_email,
      subject,
      body
    });

    await base44.entities.Invoice.update(invoiceId, {
      last_reminder_date: new Date().toISOString()
    });

    return Response.json({ 
      success: true,
      message: 'Recordatorio enviado correctamente'
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return Response.json({ 
      error: error.message || 'Error sending reminder' 
    }, { status: 500 });
  }
});