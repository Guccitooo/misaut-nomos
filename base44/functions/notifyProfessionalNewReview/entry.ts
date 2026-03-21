import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    console.log('🔔 Evento de nueva reseña:', payload.event);

    if (payload.event?.type !== 'create' || payload.event?.entity_name !== 'Review') {
      return Response.json({ ok: true, message: 'Evento ignorado' });
    }

    const reviewData = payload.data;
    
    if (!reviewData || !reviewData.professional_id) {
      return Response.json({ ok: true, message: 'Sin datos de reseña' });
    }

    // Obtener datos del profesional
    const professionalUsers = await base44.asServiceRole.entities.User.filter({ 
      id: reviewData.professional_id 
    });
    const professional = professionalUsers[0];

    if (!professional) {
      return Response.json({ ok: true, message: 'Profesional no encontrado' });
    }

    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
      user_id: reviewData.professional_id
    });
    const profile = profiles[0];
    const professionalName = profile?.business_name || professional.full_name || professional.email.split('@')[0];

    // Obtener nombre del cliente
    const clientUsers = await base44.asServiceRole.entities.User.filter({ id: reviewData.client_id });
    const clientName = clientUsers[0]?.full_name || clientUsers[0]?.email.split('@')[0] || "Un cliente";

    const rating = reviewData.rating || ((reviewData.rapidez + reviewData.comunicacion + reviewData.calidad + reviewData.precio_satisfaccion) / 4).toFixed(1);

    console.log(`📧 Enviando notificación de reseña a: ${professional.email}`);

    // Enviar email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: professional.email,
      subject: `⭐ ${clientName} te ha dejado una valoración (${rating}/5)`,
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
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
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
    .review-box {
      background: #fffbeb;
      border: 2px solid #fbbf24;
      padding: 24px;
      margin: 28px 0;
      border-radius: 12px;
    }
    .stars {
      display: flex;
      gap: 4px;
      justify-content: center;
      margin-bottom: 16px;
    }
    .star { color: #fbbf24; font-size: 28px; }
    .review-box h3 { color: #78350f; font-size: 18px; font-weight: 700; margin-bottom: 12px; text-align: center; }
    .review-box p { color: #92400e; margin: 8px 0; line-height: 1.6; }
    .cta-section { text-align: center; margin: 36px 0; }
    .cta-button { 
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      color: white;
      padding: 18px 48px;
      text-decoration: none;
      border-radius: 14px;
      font-weight: 700;
      font-size: 17px;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
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
      <div class="logo">⭐</div>
      <h1>¡Tienes una nueva valoración!</h1>
    </div>
    
    <div class="content">
      <p class="greeting">¡Enhorabuena ${professionalName}!</p>
      
      <p class="message">
        <strong>${clientName}</strong> acaba de dejar una valoración sobre tu trabajo.
      </p>

      <div class="review-box">
        <div class="stars">
          ${'⭐'.repeat(Math.round(rating))}
        </div>
        <h3>${rating}/5 estrellas</h3>
        <p style="text-align: center; margin-top: 16px;"><strong>Valoraciones detalladas:</strong></p>
        <p>🏃 Rapidez: ${reviewData.rapidez}/5</p>
        <p>💬 Comunicación: ${reviewData.comunicacion}/5</p>
        <p>✨ Calidad: ${reviewData.calidad}/5</p>
        <p>💰 Precio/Satisfacción: ${reviewData.precio_satisfaccion}/5</p>
        ${reviewData.comment ? `<p style="font-style: italic; margin-top: 16px; padding-top: 16px; border-top: 1px solid #fbbf24;">"${reviewData.comment}"</p>` : ''}
      </div>

      <p class="message">
        Las valoraciones positivas mejoran tu posición en las búsquedas y generan más confianza 
        en futuros clientes. <strong>¡Sigue así!</strong>
      </p>

      <div class="cta-section">
        <a href="https://misautonomos.es/MyProfile" class="cta-button">
          👁️ Ver mi perfil público
        </a>
      </div>
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
      user_id: reviewData.professional_id,
      type: "new_review",
      title: "Nueva valoración recibida",
      message: `${clientName} te valoró con ${rating}/5 estrellas`,
      link: `/MyProfile`,
      priority: "medium"
    });

    console.log(`✅ Notificación enviada a ${professional.email}`);

    return Response.json({ ok: true, message: 'Notificación enviada' });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ error: error.message, ok: false }, { status: 500 });
  }
});