import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('🔍 Buscando presupuestos sin responder...');

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const fortyEightHoursAgoISO = fortyEightHoursAgo.toISOString();

    // Obtener mensajes con solicitudes de presupuesto pendientes
    const allMessages = await base44.asServiceRole.entities.Message.list();
    const pendingQuotes = allMessages.filter(msg => 
      msg.quote_request &&
      msg.quote_request.status === "pending" &&
      !msg.quote_request.professional_responded &&
      new Date(msg.created_date) <= fortyEightHoursAgo &&
      new Date(msg.created_date) >= new Date(fortyEightHoursAgo.getTime() - (6 * 60 * 60 * 1000)) // Ventana de 6 horas
    );

    console.log(`📊 ${pendingQuotes.length} presupuestos sin responder hace 48h`);

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: []
    };

    for (const quoteMessage of pendingQuotes) {
      try {
        results.processed++;

        const professionalId = quoteMessage.recipient_id;
        const clientId = quoteMessage.sender_id;

        // Obtener datos del profesional
        const professionalUsers = await base44.asServiceRole.entities.User.filter({ id: professionalId });
        const professional = professionalUsers[0];
        
        if (!professional) {
          results.skipped++;
          continue;
        }

        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
          user_id: professionalId
        });
        const profile = profiles[0];

        const professionalName = profile?.business_name || professional.full_name || professional.email.split('@')[0];

        // Obtener nombre del cliente
        const clientUsers = await base44.asServiceRole.entities.User.filter({ id: clientId });
        const clientName = clientUsers[0]?.full_name || clientUsers[0]?.email.split('@')[0] || "Un cliente";

        console.log(`📧 Enviando recordatorio a: ${professional.email}`);

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: professional.email,
          subject: `💼 Tienes un presupuesto pendiente de ${clientName}`,
          body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f8fafc;
      padding: 20px 0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .header { 
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo { 
      width: 72px;
      height: 72px;
      background: white;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      margin-bottom: 20px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }
    .header h1 { 
      color: white;
      font-size: 28px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 8px;
    }
    .content { padding: 40px 32px; }
    .greeting { font-size: 22px; color: #111827; font-weight: 600; margin-bottom: 24px; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 20px; }
    .quote-box {
      background: #eff6ff;
      border-left: 6px solid #3b82f6;
      padding: 24px;
      margin: 28px 0;
      border-radius: 12px;
    }
    .quote-box h3 { color: #1e40af; font-size: 18px; font-weight: 700; margin-bottom: 12px; }
    .quote-box p { color: #1e3a8a; margin: 8px 0; line-height: 1.6; }
    .cta-section { text-align: center; margin: 36px 0; }
    .cta-button { 
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 18px 48px;
      text-decoration: none;
      border-radius: 14px;
      font-weight: 700;
      font-size: 17px;
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    }
    .footer { 
      background: #1f2937;
      padding: 40px 32px;
      text-align: center;
    }
    .footer-brand { color: #ffffff; font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    .footer-tagline { color: #60a5fa; font-size: 14px; font-style: italic; margin-bottom: 24px; }
    .footer-links { color: #9ca3af; font-size: 14px; line-height: 2; }
    .footer-links a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💼</div>
      <h1>Solicitud de presupuesto pendiente</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${professionalName},</p>
      
      <p class="message">
        Hace <strong>48 horas</strong> que <strong>${clientName}</strong> te envió una solicitud de presupuesto 
        y aún no has respondido.
      </p>

      <div class="quote-box">
        <h3>📋 Detalles de la solicitud</h3>
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Descripción:</strong></p>
        <p style="font-style: italic; margin-top: 10px;">"${quoteMessage.quote_request.description}"</p>
        ${quoteMessage.quote_request.budget ? `<p style="margin-top: 10px;"><strong>Presupuesto estimado:</strong> ${quoteMessage.quote_request.budget}€</p>` : ''}
        ${quoteMessage.quote_request.deadline ? `<p><strong>Fecha límite:</strong> ${quoteMessage.quote_request.deadline}</p>` : ''}
      </div>

      <p class="message">
        Responder rápidamente aumenta tu credibilidad y mejora tu posición en las búsquedas. 
        Los clientes valoran la rapidez de respuesta.
      </p>

      <div class="cta-section">
        <a href="https://misautonomos.es/Messages?conversation=${quoteMessage.conversation_id}" class="cta-button">
          💬 Responder ahora
        </a>
      </div>

      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        Recuerda que una respuesta profesional y rápida genera más confianza en los clientes.
      </p>
    </div>
    
    <div class="footer">
      <div class="footer-brand">MisAutónomos</div>
      <div class="footer-tagline">Tu autónomo de confianza</div>
      <div class="footer-links">
        <a href="https://misautonomos.es">misautonomos.es</a><br/>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a>
      </div>
    </div>
  </div>
</body>
</html>
          `,
          from_name: "MisAutónomos"
        });

        // Crear notificación interna
        await base44.asServiceRole.entities.Notification.create({
          user_id: professionalId,
          type: "quote_reminder",
          title: "Presupuesto sin responder",
          message: `${clientName} está esperando tu respuesta`,
          link: `/Messages?conversation=${quoteMessage.conversation_id}`,
          priority: "high"
        });

        results.sent++;
        console.log(`✅ Recordatorio enviado a ${professional.email}`);

      } catch (error) {
        console.error(`❌ Error procesando presupuesto ${quoteMessage.id}:`, error.message);
        results.errors.push({ message_id: quoteMessage.id, error: error.message });
      }
    }

    console.log('✅ Proceso completado:', results);

    return Response.json({
      ok: true,
      message: `${results.sent} recordatorios enviados`,
      results
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    return Response.json({ error: error.message, ok: false }, { status: 500 });
  }
});