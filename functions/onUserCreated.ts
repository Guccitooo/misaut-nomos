import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user } = await req.json();

    if (!user || !user.email) {
      return Response.json({ error: 'Invalid user data' }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: "Bienvenido a MisAutónomos",
      body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: white;
      border-radius: 16px;
      padding: 12px;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #e0e7ff;
      margin: 12px 0 0 0;
      font-size: 18px;
    }
    .content {
      padding: 48px 32px;
    }
    .greeting {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 24px;
      font-weight: 700;
    }
    .message {
      color: #4b5563;
      line-height: 1.8;
      font-size: 16px;
      margin-bottom: 28px;
    }
    .welcome-box {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 28px;
      border-radius: 12px;
      margin: 32px 0;
      text-align: center;
    }
    .welcome-box h2 {
      margin: 0 0 16px 0;
      font-size: 24px;
      font-weight: 700;
    }
    .welcome-box p {
      margin: 0;
      font-size: 16px;
      opacity: 0.95;
      line-height: 1.6;
    }
    .features {
      background: #f9fafb;
      border-left: 4px solid #3b82f6;
      padding: 24px;
      margin: 32px 0;
      border-radius: 8px;
    }
    .features h3 {
      color: #1e40af;
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 700;
    }
    .features ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .features li {
      color: #4b5563;
      margin-bottom: 14px;
      padding-left: 28px;
      position: relative;
      line-height: 1.6;
    }
    .features li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 18px;
    }
    .cta {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      color: white;
      padding: 18px 48px;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 18px;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
      transition: all 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
    }
    .footer {
      background: #1f2937;
      color: #9ca3af;
      padding: 40px 32px;
      text-align: center;
      font-size: 14px;
      line-height: 1.8;
    }
    .footer-brand {
      color: #ffffff;
      display: block;
      margin-bottom: 8px;
      font-size: 20px;
      font-weight: 700;
    }
    .footer-tagline {
      color: #60a5fa;
      margin-bottom: 20px;
      font-style: italic;
      font-size: 16px;
    }
    .footer-links {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #374151;
    }
    .footer-links a {
      color: #60a5fa;
      text-decoration: none;
      margin: 0 12px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb, transparent);
      margin: 32px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png" alt="MisAutónomos" class="logo" />
      <h1>MisAutónomos</h1>
      <p>Tu autónomo de confianza</p>
    </div>

    <div class="content">
      <p class="greeting">¡Bienvenido a MisAutónomos!</p>

      <div class="welcome-box">
        <h2>Tu cuenta ha sido creada correctamente</h2>
        <p>Estás a un paso de conectar con los mejores profesionales autónomos de España</p>
      </div>

      <p class="message">
        Nos alegra tenerte con nosotros. MisAutónomos es la plataforma líder para conectar clientes con profesionales autónomos verificados en toda España.
      </p>

      <div class="features">
        <h3>A partir de ahora ya puedes:</h3>
        <ul>
          <li>Buscar autónomos verificados por categoría y ubicación</li>
          <li>Chatear directamente con profesionales</li>
          <li>Ver perfiles completos con fotos, reseñas y servicios</li>
          <li>Guardar tus profesionales favoritos</li>
          <li>Contratar con total confianza y seguridad</li>
        </ul>
      </div>

      <div class="cta">
        <a href="https://misautonomos.es" class="button">
          Entrar a mi cuenta
        </a>
      </div>

      <div class="divider"></div>

      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        ¿Tienes alguna duda? Nuestro equipo está aquí para ayudarte.<br/>
        Escríbenos a <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6; text-decoration: none; font-weight: 600;">soporte@misautonomos.es</a>
      </p>
    </div>

    <div class="footer">
      <span class="footer-brand">MisAutónomos</span>
      <p class="footer-tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:info@misautonomos.es">info@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
      
      <div class="footer-links">
        <a href="https://misautonomos.es/PrivacyPolicy">Política de Privacidad</a>
        <a href="https://misautonomos.es/TermsConditions">Términos y Condiciones</a>
      </div>
      
      <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
        © ${new Date().getFullYear()} MisAutónomos. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
      `,
      from_name: "MisAutónomos"
    });

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