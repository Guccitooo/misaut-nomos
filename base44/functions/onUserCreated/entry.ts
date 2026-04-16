import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user } = await req.json();

    if (!user || !user.email) {
      return Response.json({ error: 'Invalid user data' }, { status: 400 });
    }

    const userName = user.full_name || user.email.split('@')[0];

    // Email de bienvenida para CLIENTES
    const emailTimeout = AbortSignal.timeout(30000);
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: "¡Bienvenido a MisAutónomos! Tu cuenta está lista",
      body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 64px; height: 64px; margin: 0 auto 16px; }
    .logo img { width: 100%; height: 100%; border-radius: 12px; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; }
    .content { padding: 40px 32px; }
    .greeting { font-size: 22px; color: #1f2937; margin-bottom: 20px; font-weight: 700; }
    .message { color: #4b5563; line-height: 1.7; font-size: 16px; margin-bottom: 24px; }
    .highlight-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .highlight-box h3 { color: #047857; margin: 0 0 8px 0; font-size: 18px; }
    .highlight-box p { color: #374151; margin: 4px 0; font-size: 15px; }
    .features { margin: 24px 0; list-style: none; padding: 0; }
    .features li { color: #4b5563; margin-bottom: 12px; padding-left: 28px; position: relative; line-height: 1.6; }
    .features li:before { content: '✓'; position: absolute; left: 0; color: #10b981; font-weight: bold; }
    .cta { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white !important; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35); }
    .divider { height: 1px; background: linear-gradient(to right, transparent, #e5e7eb, transparent); margin: 32px 0; }
    .promo-section { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center; }
    .promo-section h4 { color: #92400e; margin: 0 0 8px 0; font-size: 16px; }
    .promo-section p { color: #78350f; margin: 0 0 16px 0; font-size: 14px; }
    .button-orange { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 32px; text-align: center; font-size: 14px; line-height: 1.7; }
    .footer-brand { color: #ffffff; display: block; margin-bottom: 4px; font-size: 18px; font-weight: 700; }
    .footer-tagline { color: #60a5fa; margin-bottom: 16px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
    .footer-links { margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151; }
    .footer-links a { margin: 0 12px; }
    .small-text { font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px; }
    @media (max-width: 600px) {
      .content { padding: 24px 20px; }
      .header { padding: 32px 16px; }
      .header h1 { font-size: 20px; }
      .button { padding: 14px 32px; font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <img src="${LOGO_URL}" alt="MisAutónomos" />
      </div>
      <h1>¡Bienvenido a MisAutónomos!</h1>
      <p>Tu autónomo de confianza</p>
    </div>

    <div class="content">
      <p class="greeting">¡Hola ${userName}!</p>
      
      <div class="highlight-box">
        <h3>✅ Tu cuenta está lista</h3>
        <p>Ya puedes buscar y contactar con profesionales autónomos verificados en toda España.</p>
      </div>
      
      <p class="message">
        MisAutónomos conecta a clientes como tú con los mejores profesionales autónomos. 
        Todo <strong>100% gratis</strong> para ti.
      </p>
      
      <ul class="features">
        <li>Busca autónomos por categoría y ubicación</li>
        <li>Consulta perfiles con fotos, reseñas y valoraciones</li>
        <li>Contacta directamente por chat, teléfono o WhatsApp</li>
        <li>Guarda tus profesionales favoritos</li>
        <li>Sin comisiones ni costes ocultos</li>
      </ul>
      
      <div class="cta">
        <a href="https://misautonomos.es/buscar" class="button">
          Buscar autónomos ahora →
        </a>
      </div>
      
      <div class="divider"></div>
      
      <div class="promo-section">
        <h4>🔧 ¿Eres profesional autónomo?</h4>
        <p>Únete a MisAutónomos y empieza a recibir clientes. 60 días gratis sin compromiso.</p>
        <a href="https://misautonomos.es/precios" class="button-orange">
          Suscribirme como autónomo →
        </a>
      </div>
      
      <p class="small-text">
        ¿Tienes dudas? Escríbenos a <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a>
      </p>
    </div>

    <div class="footer">
      <span class="footer-brand">MisAutónomos</span>
      <p class="footer-tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a> · 
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
      <div class="footer-links">
        <a href="https://misautonomos.es/ayuda">Centro de ayuda</a>
        <a href="https://misautonomos.es/privacidad">Privacidad</a>
        <a href="https://misautonomos.es/terminos">Términos</a>
      </div>
      <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">
        © ${new Date().getFullYear()} MisAutónomos. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
      `,
      from_name: "MisAutónomos"
    });

    // Notificar en Slack
    try {
      await base44.asServiceRole.functions.invoke('notifySlackNewClient', {
        clientName: userName,
        clientEmail: user.email,
        clientType: 'client'
      });
    } catch (slackError) {
      console.error('Error Slack (no crítico):', slackError.message);
    }

    return Response.json({ 
      ok: true,
      message: 'Welcome email sent successfully'
    });

  } catch (error) {
    console.error('Error in onUserCreated:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});