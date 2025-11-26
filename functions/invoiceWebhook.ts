import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  console.log('🧾 ========== WEBHOOK FACTURAS RECIBIDO ==========');
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('❌ Sin firma de Stripe');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('✅ Evento verificado:', event.type);
    } catch (err) {
      console.error('❌ Error verificando firma:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

    // Solo procesar pagos de facturas
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata || {};
      
      // Verificar que es un pago de factura
      if (metadata.type !== 'invoice_payment') {
        console.log('ℹ️ No es un pago de factura, ignorando');
        return Response.json({ received: true });
      }

      const invoiceId = metadata.invoiceId;
      console.log('💳 Pago de factura recibido:', invoiceId);

      // Obtener la factura
      const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId });
      const invoice = invoices[0];

      if (!invoice) {
        console.error('❌ Factura no encontrada:', invoiceId);
        return Response.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Marcar como pagada
      await base44.asServiceRole.entities.Invoice.update(invoiceId, {
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'stripe',
        stripe_payment_id: session.payment_intent
      });

      console.log('✅ Factura marcada como pagada:', invoice.invoice_number);

      // Obtener datos del profesional
      const users = await base44.asServiceRole.entities.User.filter({ id: invoice.professional_id });
      const professionalUser = users[0];
      
      const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ 
        user_id: invoice.professional_id 
      });
      const professionalName = profiles[0]?.business_name || professionalUser?.full_name || 'Profesional';

      // ========== EMAIL AL AUTÓNOMO (Pago recibido) ==========
      if (professionalUser?.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: professionalUser.email,
          subject: `💰 ¡Pago recibido! Factura ${invoice.invoice_number}`,
          body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 56px; height: 56px; margin: 0 auto 12px; }
    .logo img { width: 100%; height: 100%; border-radius: 10px; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 17px; color: #1f2937; margin-bottom: 20px; }
    .success-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .success-box h3 { color: #047857; margin: 0 0 12px 0; font-size: 18px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-size: 14px; }
    .detail-value { color: #1f2937; font-size: 14px; font-weight: 600; }
    .amount-big { font-size: 32px; font-weight: 700; color: #059669; text-align: center; margin: 20px 0; }
    .cta { text-align: center; margin: 28px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 12px; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><img src="${LOGO_URL}" alt="MisAutónomos" /></div>
      <h1>💰 ¡Pago recibido!</h1>
      <p>Tu cliente ha pagado la factura</p>
    </div>
    <div class="content">
      <p class="greeting">¡Hola ${professionalName}!</p>
      
      <div class="success-box">
        <h3>✅ Pago confirmado</h3>
        <p style="color: #065f46; margin: 0;">Tu cliente <strong>${invoice.client_name}</strong> ha pagado la factura con tarjeta.</p>
      </div>
      
      <p class="amount-big">${invoice.total.toFixed(2)}€</p>
      
      <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0;">
        <div class="detail-row">
          <span class="detail-label">Factura</span>
          <span class="detail-value">${invoice.invoice_number}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cliente</span>
          <span class="detail-value">${invoice.client_name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha de pago</span>
          <span class="detail-value">${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Método</span>
          <span class="detail-value">Tarjeta (Stripe)</span>
        </div>
      </div>
      
      <div class="cta">
        <a href="https://misautonomos.es/Invoices" class="button">Ver mis facturas →</a>
      </div>
      
      <p style="font-size: 13px; color: #6b7280; text-align: center;">
        El importe se transferirá a tu cuenta bancaria según los plazos de Stripe.
      </p>
    </div>
    <div class="footer">
      <strong style="color: #fff;">MisAutónomos</strong> · <a href="https://misautonomos.es">misautonomos.es</a>
    </div>
  </div>
</body>
</html>
          `,
          from_name: "MisAutónomos"
        });
        console.log('📧 Email de pago enviado al autónomo:', professionalUser.email);
      }

      // ========== EMAIL AL CLIENTE (Confirmación de pago) ==========
      if (invoice.client_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: invoice.client_email,
          subject: `✅ Pago confirmado - Factura ${invoice.invoice_number}`,
          body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 56px; height: 56px; margin: 0 auto 12px; }
    .logo img { width: 100%; height: 100%; border-radius: 10px; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 17px; color: #1f2937; margin-bottom: 20px; line-height: 1.6; }
    .success-box { background: #ecfdf5; border: 2px solid #10b981; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center; }
    .success-box h3 { color: #047857; margin: 0 0 8px 0; font-size: 20px; }
    .success-box p { color: #065f46; margin: 0; font-size: 15px; }
    .amount-big { font-size: 36px; font-weight: 700; color: #059669; margin: 16px 0; }
    .detail-box { background: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-size: 14px; }
    .detail-value { color: #1f2937; font-size: 14px; font-weight: 600; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 12px; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><img src="${LOGO_URL}" alt="MisAutónomos" /></div>
      <h1>✅ Pago confirmado</h1>
      <p>Gracias por tu pago</p>
    </div>
    <div class="content">
      <p class="greeting">Estimado/a <strong>${invoice.client_name}</strong>,</p>
      
      <div class="success-box">
        <h3>✓ Pago recibido correctamente</h3>
        <p class="amount-big">${invoice.total.toFixed(2)}€</p>
        <p>Tu pago ha sido procesado con éxito</p>
      </div>
      
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Factura</span>
          <span class="detail-value">${invoice.invoice_number}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Profesional</span>
          <span class="detail-value">${professionalName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha de pago</span>
          <span class="detail-value">${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Método de pago</span>
          <span class="detail-value">Tarjeta de crédito/débito</span>
        </div>
      </div>
      
      <p style="font-size: 14px; color: #4b5563; text-align: center; line-height: 1.6;">
        Este email sirve como comprobante de pago.<br>
        Guárdalo para tus registros.
      </p>
      
      <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px;">
        ¿Tienes alguna pregunta?<br>
        Contacta con ${professionalName}: <a href="mailto:${invoice.emisor_email}" style="color: #2563eb;">${invoice.emisor_email}</a>
      </p>
    </div>
    <div class="footer">
      <strong style="color: #fff;">MisAutónomos</strong><br/><br/>
      <a href="https://misautonomos.es">misautonomos.es</a>
    </div>
  </div>
</body>
</html>
          `,
          from_name: "MisAutónomos"
        });
        console.log('📧 Email de confirmación enviado al cliente:', invoice.client_email);
      }

      console.log('✅ ========== PAGO DE FACTURA PROCESADO ==========');
    }

    return Response.json({ received: true, processed: true });

  } catch (error) {
    console.error('❌ Error en webhook de facturas:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});