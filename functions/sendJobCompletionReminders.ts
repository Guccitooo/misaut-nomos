import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('🔍 Buscando trabajos aceptados sin completar...');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Obtener mensajes con presupuestos aceptados
    const allMessages = await base44.asServiceRole.entities.Message.list();
    const acceptedQuotes = allMessages.filter(msg => 
      msg.quote_request &&
      msg.quote_request.status === "accepted" &&
      new Date(msg.updated_date || msg.created_date) <= sevenDaysAgo &&
      new Date(msg.updated_date || msg.created_date) >= new Date(sevenDaysAgo.getTime() - (6 * 60 * 60 * 1000)) // Ventana de 6 horas
    );

    console.log(`📊 ${acceptedQuotes.length} trabajos aceptados sin completar hace 7 días`);

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: []
    };

    for (const quoteMessage of acceptedQuotes) {
      try {
        results.processed++;

        const professionalId = quoteMessage.recipient_id === quoteMessage.sender_id 
          ? quoteMessage.recipient_id 
          : (quoteMessage.quote_request.professional_responded ? quoteMessage.sender_id : quoteMessage.recipient_id);
        
        const clientId = professionalId === quoteMessage.sender_id ? quoteMessage.recipient_id : quoteMessage.sender_id;

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
        const clientName = clientUsers[0]?.full_name || clientUsers[0]?.email.split('@')[0] || "el cliente";

        console.log(`📧 Enviando recordatorio a: ${professional.email}`);

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: professional.email,
          subject: `🔔 Recordatorio: ¿Ya completaste el trabajo de ${clientName}?`,
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
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
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
    }
    .content { padding: 40px 32px; }
    .greeting { font-size: 22px; color: #111827; font-weight: 600; margin-bottom: 24px; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 20px; }
    .work-box {
      background: #f0fdf4;
      border-left: 6px solid #10b981;
      padding: 24px;
      margin: 28px 0;
      border-radius: 12px;
    }
    .work-box h3 { color: #065f46; font-size: 18px; font-weight: 700; margin-bottom: 12px; }
    .work-box p { color: #047857; margin: 8px 0; line-height: 1.6; }
    .cta-section { text-align: center; margin: 36px 0; }
    .cta-button { 
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 18px 48px;
      text-decoration: none;
      border-radius: 14px;
      font-weight: 700;
      font-size: 17px;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
    }
    .tip-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .tip-box p { color: #78350f; font-size: 15px; line-height: 1.6; margin: 0; }
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
      <div class="logo">✅</div>
      <h1>Recordatorio de trabajo</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${professionalName},</p>
      
      <p class="message">
        Han pasado <strong>7 días</strong> desde que <strong>${clientName}</strong> aceptó tu presupuesto.
      </p>

      <div class="work-box">
        <h3>🛠️ Trabajo aceptado</h3>
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Descripción:</strong></p>
        <p style="font-style: italic; margin-top: 10px;">"${quoteMessage.quote_request.description}"</p>
        ${quoteMessage.quote_request.quote_amount ? `<p style="margin-top: 10px;"><strong>Importe:</strong> ${quoteMessage.quote_request.quote_amount}€</p>` : ''}
      </div>

      <p class="message">
        ¿Ya completaste este trabajo? Marca el trabajo como completado para mantener tu historial actualizado 
        y anima al cliente a dejar una valoración.
      </p>

      <div class="tip-box">
        <p><strong>💡 Consejo:</strong> Las valoraciones positivas mejoran tu visibilidad en las búsquedas y generan más confianza.</p>
      </div>

      <div class="cta-section">
        <a href="https://misautonomos.es/Messages?conversation=${quoteMessage.conversation_id}" class="cta-button">
          ✅ Actualizar estado del trabajo
        </a>
      </div>

      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        Si el trabajo aún está en progreso, no te preocupes. Este es solo un recordatorio amigable.
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
          type: "job_reminder",
          title: "Trabajo pendiente de completar",
          message: `Han pasado 7 días desde que ${clientName} aceptó tu presupuesto`,
          link: `/Messages?conversation=${quoteMessage.conversation_id}`,
          priority: "medium"
        });

        results.sent++;
        console.log(`✅ Recordatorio enviado a ${professional.email}`);

      } catch (error) {
        console.error(`❌ Error procesando trabajo ${quoteMessage.id}:`, error.message);
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