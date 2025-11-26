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
      return Response.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    if (invoice.professional_id !== user.id) {
      return Response.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!invoice.client_email) {
      return Response.json({ error: 'La factura no tiene email de cliente' }, { status: 400 });
    }

    // Obtener perfil del profesional para el nombre
    const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
    const professionalName = profiles[0]?.business_name || user.full_name || 'Tu profesional';

    const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

    // Preparar items HTML
    const itemsHTML = (invoice.items || []).map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${(item.unit_price || 0).toFixed(2)}€</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">${(item.total || 0).toFixed(2)}€</td>
      </tr>
    `).join('');

    // Botón de pago si existe link de Stripe
    const paymentButtonHTML = invoice.payment_link ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${invoice.payment_link}" 
           style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
          💳 Pagar factura online →
        </a>
        <p style="font-size: 12px; color: #6b7280; margin-top: 12px;">Pago seguro con tarjeta de crédito/débito</p>
      </div>
    ` : '';

    // Datos bancarios si existen
    const bankDetailsHTML = invoice.emisor_iban ? `
      <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <h3 style="color: #0369a1; margin: 0 0 12px 0; font-size: 15px;">🏦 Datos para transferencia bancaria</h3>
        <p style="color: #0c4a6e; margin: 4px 0; font-size: 14px;"><strong>IBAN:</strong> ${invoice.emisor_iban}</p>
        <p style="color: #0c4a6e; margin: 4px 0; font-size: 14px;"><strong>Concepto:</strong> ${invoice.invoice_number}</p>
      </div>
    ` : '';

    const emailBody = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); padding: 40px 24px; text-align: center; }
    .logo { width: 56px; height: 56px; margin: 0 auto 12px; }
    .logo img { width: 100%; height: 100%; border-radius: 10px; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 17px; color: #1f2937; margin-bottom: 20px; line-height: 1.6; }
    .invoice-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
    .invoice-number { font-size: 20px; font-weight: 700; color: #1f2937; }
    .invoice-date { font-size: 14px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; }
    .total-section { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 10px; padding: 20px; margin-top: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #4b5563; }
    .total-row.final { padding-top: 12px; margin-top: 12px; border-top: 2px solid #3b82f6; }
    .total-row.final span:first-child { font-size: 18px; font-weight: 700; color: #1e40af; }
    .total-row.final span:last-child { font-size: 24px; font-weight: 700; color: #1e40af; }
    .due-date-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .due-date-box p { color: #92400e; margin: 0; font-size: 14px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 12px; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><img src="${LOGO_URL}" alt="MisAutónomos" /></div>
      <h1>📄 Nueva factura</h1>
      <p>De ${professionalName}</p>
    </div>

    <div class="content">
      <p class="greeting">
        Estimado/a <strong>${invoice.client_name}</strong>,<br><br>
        Adjuntamos la factura correspondiente a nuestros servicios.
      </p>

      <div class="invoice-box">
        <div style="margin-bottom: 16px;">
          <span class="invoice-number">${invoice.invoice_number}</span>
        </div>
        
        <div style="display: flex; gap: 40px; margin-bottom: 16px;">
          <div>
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">Fecha de emisión</p>
            <p style="font-size: 14px; color: #1f2937; margin: 0; font-weight: 500;">${new Date(invoice.issue_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div>
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px;">Fecha de vencimiento</p>
            <p style="font-size: 14px; color: #1f2937; margin: 0; font-weight: 500;">${new Date(invoice.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th style="text-align: center;">Cant.</th>
              <th style="text-align: right;">Precio</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${(invoice.subtotal || 0).toFixed(2)}€</span>
          </div>
          <div class="total-row">
            <span>IVA</span>
            <span>${(invoice.total_iva || 0).toFixed(2)}€</span>
          </div>
          ${invoice.aplica_retencion ? `
          <div class="total-row" style="color: #dc2626;">
            <span>Retención IRPF (${invoice.porcentaje_retencion}%)</span>
            <span>-${(invoice.total_retencion || 0).toFixed(2)}€</span>
          </div>
          ` : ''}
          <div class="total-row final">
            <span>TOTAL A PAGAR</span>
            <span>${(invoice.total || 0).toFixed(2)}€</span>
          </div>
        </div>
      </div>

      ${paymentButtonHTML}
      
      ${bankDetailsHTML}

      <div class="due-date-box">
        <p><strong>📅 Fecha límite de pago:</strong> ${new Date(invoice.due_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      ${invoice.notes ? `
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 20px;">
        <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;"><strong>Notas:</strong></p>
        <p style="font-size: 14px; color: #4b5563; margin: 0; line-height: 1.5;">${invoice.notes}</p>
      </div>
      ` : ''}

      <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px;">
        ¿Tienes alguna pregunta sobre esta factura?<br>
        Contacta con ${professionalName}: <a href="mailto:${invoice.emisor_email || user.email}" style="color: #2563eb;">${invoice.emisor_email || user.email}</a>
      </p>
    </div>

    <div class="footer">
      <strong style="color: #fff; font-size: 14px;">MisAutónomos</strong><br/>
      <span style="color: #60a5fa; font-style: italic;">Facturación profesional</span><br/><br/>
      <a href="https://misautonomos.es">misautonomos.es</a>
    </div>
  </div>
</body>
</html>
    `;

    // Enviar email
    await base44.integrations.Core.SendEmail({
      to: invoice.client_email,
      subject: `📄 Factura ${invoice.invoice_number} de ${professionalName}`,
      body: emailBody
    });

    // Actualizar estado de la factura
    await base44.entities.Invoice.update(invoice.id, {
      status: invoice.status === 'draft' ? 'sent' : invoice.status,
      last_reminder_date: new Date().toISOString()
    });

    return Response.json({ 
      success: true,
      message: `Factura enviada a ${invoice.client_email}`
    });

  } catch (error) {
    console.error('Error sending invoice:', error);
    return Response.json({ 
      error: error.message || 'Error enviando la factura' 
    }, { status: 500 });
  }
});