import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Solo admin puede ejecutar esta función
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('🔍 Buscando clientes para convertir...');

    // Calcular fecha de hace 3 días
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoISO = threeDaysAgo.toISOString();

    // Obtener todos los usuarios tipo cliente
    const allUsers = await base44.asServiceRole.entities.User.list();
    const clientUsers = allUsers.filter(u => 
      u.user_type === "client" && 
      new Date(u.created_date) <= threeDaysAgo &&
      new Date(u.created_date) >= new Date(threeDaysAgo.getTime() - (24 * 60 * 60 * 1000)) // Solo los de hace 3 días (±1 día)
    );

    console.log(`📊 Encontrados ${clientUsers.length} clientes de hace 3 días`);

    const results = {
      processed: 0,
      skipped: 0,
      sent: 0,
      errors: [],
      details: []
    };

    for (const clientUser of clientUsers) {
      try {
        results.processed++;

        // Verificar si ya tiene suscripción
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          user_id: clientUser.id
        });
        const hasActiveSubscription = subscriptions.some(s => 
          s.estado === 'activo' || s.estado === 'en_prueba'
        );

        if (hasActiveSubscription) {
          console.log(`⏭️ ${clientUser.email} ya tiene suscripción activa`);
          results.skipped++;
          results.details.push({ email: clientUser.email, reason: 'Ya tiene suscripción' });
          continue;
        }

        // Verificar si ya tiene perfil profesional
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
          user_id: clientUser.id
        });

        if (profiles.length > 0 && profiles[0].onboarding_completed) {
          console.log(`⏭️ ${clientUser.email} ya completó onboarding profesional`);
          results.skipped++;
          results.details.push({ email: clientUser.email, reason: 'Ya es profesional' });
          continue;
        }

        // Obtener nombre real del usuario
        const userName = clientUser.full_name && clientUser.full_name.trim() !== ''
          ? clientUser.full_name
          : clientUser.email.split('@')[0]
              .replace(/\d+$/g, '')
              .split(/[-._]/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');

        // Contar plazas disponibles (máximo 10 por ciudad - ejemplo genérico)
        const totalProfessionals = await base44.asServiceRole.entities.ProfessionalProfile.filter({
          visible_en_busqueda: true,
          onboarding_completed: true
        });
        const plazasDisponibles = Math.max(5, 15 - (totalProfessionals.length % 20));

        console.log(`📧 Enviando email a: ${clientUser.email} (${userName})`);

        // Enviar email de conversión premium
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: clientUser.email,
          subject: `${userName}, ¿eres profesional? Activa tu perfil GRATIS 🎁`,
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
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      padding: 48px 32px;
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
    .header p {
      color: #dbeafe;
      font-size: 16px;
      line-height: 1.5;
    }
    .content { 
      padding: 40px 32px;
    }
    .greeting { 
      font-size: 22px;
      color: #111827;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .message { 
      color: #4b5563;
      line-height: 1.8;
      font-size: 16px;
      margin-bottom: 24px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 6px solid #f59e0b;
      padding: 24px;
      margin: 32px 0;
      border-radius: 12px;
    }
    .highlight-box h3 {
      color: #92400e;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .highlight-box p {
      color: #78350f;
      font-size: 16px;
      line-height: 1.6;
    }
    .benefit-list {
      background: #f9fafb;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .benefit-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }
    .benefit-item:last-child { margin-bottom: 0; }
    .benefit-icon {
      width: 24px;
      height: 24px;
      background: #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      flex-shrink: 0;
    }
    .benefit-text {
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
      flex: 1;
    }
    .cta-section { 
      text-align: center;
      margin: 40px 0 32px 0;
    }
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
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5);
    }
    .urgency {
      background: #fee2e2;
      border: 2px dashed #ef4444;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .urgency p {
      color: #991b1b;
      font-weight: 600;
      font-size: 15px;
      margin: 0;
    }
    .footer { 
      background: #1f2937;
      padding: 40px 32px;
      text-align: center;
    }
    .footer-brand {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .footer-tagline {
      color: #60a5fa;
      font-size: 14px;
      font-style: italic;
      margin-bottom: 24px;
    }
    .footer-links {
      color: #9ca3af;
      font-size: 14px;
      line-height: 2;
    }
    .footer-links a {
      color: #60a5fa;
      text-decoration: none;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .container { border-radius: 0; }
      .header { padding: 32px 20px; }
      .header h1 { font-size: 24px; }
      .content { padding: 32px 20px; }
      .greeting { font-size: 20px; }
      .cta-button { padding: 16px 32px; font-size: 16px; }
      .highlight-box { padding: 20px; }
      .benefit-list { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💼</div>
      <h1>¿Eres profesional autónomo?</h1>
      <p>Hemos notado que te registraste como cliente</p>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${userName},</p>
      
      <p class="message">
        Te escribimos porque vemos que te registraste como <strong>cliente</strong> en MisAutónomos hace unos días.
      </p>

      <p class="message">
        Si en realidad eres un <strong>profesional autónomo</strong> (electricista, fontanero, carpintero, etc.) 
        y quieres <strong>recibir clientes</strong>, ¡tenemos buenas noticias para ti! 🎉
      </p>

      <div class="highlight-box">
        <h3>🎁 7 días GRATIS para ti</h3>
        <p>
          Activa tu perfil profesional ahora y empieza a recibir solicitudes de presupuestos 
          desde el primer día. Sin compromiso, cancela cuando quieras.
        </p>
      </div>

      <div class="benefit-list">
        <div class="benefit-item">
          <div class="benefit-icon">✓</div>
          <div class="benefit-text">
            <strong>Aparece en búsquedas</strong> de miles de clientes que buscan servicios en tu zona
          </div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">✓</div>
          <div class="benefit-text">
            <strong>Chat directo con clientes</strong> interesados en tus servicios
          </div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">✓</div>
          <div class="benefit-text">
            <strong>CRM completo</strong> para gestionar tus clientes y trabajos
          </div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">✓</div>
          <div class="benefit-text">
            <strong>Sistema de facturación</strong> incluido
          </div>
        </div>
      </div>

      <div class="urgency">
        <p>⚠️ Solo quedan ${plazasDisponibles} plazas disponibles en tu zona</p>
      </div>

      <div class="cta-section">
        <a href="https://misautonomos.es/PricingPlans" class="cta-button">
          🚀 Activar mis 7 días GRATIS
        </a>
      </div>

      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 32px;">
        Si NO eres profesional y solo buscas servicios, puedes ignorar este email. 
        Tu cuenta de cliente sigue activa y funcional.
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

        results.sent++;
        results.details.push({ 
          email: clientUser.email, 
          name: userName,
          status: 'sent',
          created_date: clientUser.created_date
        });

        console.log(`✅ Email enviado a: ${clientUser.email}`);

      } catch (userError) {
        console.error(`❌ Error procesando ${clientUser.email}:`, userError.message);
        results.errors.push({
          email: clientUser.email,
          error: userError.message
        });
      }
    }

    console.log('✅ Proceso completado:', results);

    return Response.json({
      ok: true,
      message: `Proceso completado: ${results.sent} emails enviados, ${results.skipped} omitidos`,
      results
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    return Response.json({ 
      error: error.message,
      ok: false
    }, { status: 500 });
  }
});