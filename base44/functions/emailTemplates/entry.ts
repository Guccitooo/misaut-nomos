// Templates HTML como funciones — devuelven HTML completo
// Diseño responsivo con inline styles para compatibilidad máxima en clientes de email

export function welcomeTemplate({ name, ctaUrl }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: white; padding: 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
      <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">MisAutónomos</h1>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 30px;">
      <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px;">¡Bienvenido, ${name}!</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 15px 0;">Gracias por registrarte en MisAutónomos. Estamos emocionados de tenerte con nosotros.</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 15px 0;">Explora la plataforma, crea tu perfil y comienza a conectar con profesionales de calidad.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${ctaUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Empieza ahora</a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="padding: 20px 30px; background: #f3f4f6; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 10px 0;">MisAutónomos | Barcelona, España</p>
      <p style="margin: 10px 0;">Has recibido este email porque tienes una cuenta en MisAutónomos.</p>
    </div>
  </div>
</body>
</html>`;
}

export function giftReceivedTemplate({ name, planName, until, hasProfile, profileUrl }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: white;">🎉 ¡Plan ${planName} Gratis!</h1>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 30px;">
      <p style="display: inline-block; background: #ecfdf5; color: #047857; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px;">Plan Premium hasta ${until}</p>
      
      <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px;">¡Felicidades, ${name}!</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 15px 0;">Has recibido acceso gratuito a nuestro Plan ${planName} Premium.</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 15px 0;"><strong>Incluye:</strong></p>
      <ul style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 15px 0;">
        <li>✅ Campañas publicitarias en redes sociales</li>
        <li>✅ Acceso a herramientas de marketing avanzadas</li>
        <li>✅ Presupuesto para anuncios incluido</li>
        <li>✅ Soporte prioritario</li>
      </ul>
      <p style="font-size: 14px; color: #9ca3af; margin-top: 20px;">Tu acceso expira el <strong>${until}</strong>.</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${profileUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Ver mi Plan ${planName}</a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="padding: 20px 30px; background: #f3f4f6; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 10px 0;">MisAutónomos | Barcelona, España</p>
      <p style="margin: 10px 0;">Has recibido este email porque tienes una cuenta en MisAutónomos.</p>
    </div>
  </div>
</body>
</html>`;
}

export function reviewRequestTemplate({ clientName, professionalName, reviewUrl }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: white;">⭐ Tu opinión importa</h1>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 30px;">
      <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px;">Hola ${clientName},</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 15px 0;">Hemos visto que contactaste recientemente con <strong>${professionalName}</strong> a través de MisAutónomos.</p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 15px 0;">Nos gustaría saber qué tal fue tu experiencia. Tu opinión ayuda a otros clientes a encontrar los mejores profesionales y a mejorar la plataforma.</p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 15px 0;"><strong>¡Solo te toma 2 minutos! ⏱️</strong></p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${reviewUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Dejar opinión</a>
      </div>
      
      <p style="font-size: 14px; color: #9ca3af; text-align: center; margin-top: 20px;">Si prefieres no dejar opinión, puedes ignorar este email.</p>
    </div>
    
    <!-- Footer -->
    <div style="padding: 20px 30px; background: #f3f4f6; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 10px 0;">MisAutónomos | Barcelona, España</p>
      <p style="margin: 10px 0;">Has recibido este email porque tienes una cuenta en MisAutónomos.</p>
    </div>
  </div>
</body>
</html>`;
}

export function genericTemplate({ headline, body, ctaText, ctaUrl }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: white; padding: 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
      <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">MisAutónomos</h1>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 30px;">
      <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px;">${headline}</h2>
      <div style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 15px 0;">
        ${body}
      </div>
      ${ctaUrl && ctaText ? `<div style="text-align: center; margin-top: 30px;">
        <a href="${ctaUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">${ctaText}</a>
      </div>` : ''}
    </div>
    
    <!-- Footer -->
    <div style="padding: 20px 30px; background: #f3f4f6; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 10px 0;">MisAutónomos | Barcelona, España</p>
      <p style="margin: 10px 0;">Has recibido este email porque tienes una cuenta en MisAutónomos.</p>
    </div>
  </div>
</body>
</html>`;
}