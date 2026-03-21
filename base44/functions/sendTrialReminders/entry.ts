import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

/**
 * CRON JOB: Enviar recordatorios de prueba gratuita
 * - Día 30: Recordatorio mitad de prueba
 * - Día 59: Aviso de fin de prueba (1 día antes)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('📬 Iniciando envío de recordatorios de prueba');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Obtener suscripciones en prueba
    const subscriptions = await base44.asServiceRole.entities.Subscription.list();
    const trialSubs = subscriptions.filter(sub => 
      sub.estado === 'en_prueba' || sub.estado === 'trialing' || sub.estado === 'trial_active'
    );
    
    console.log(`📊 Suscripciones en prueba: ${trialSubs.length}`);
    
    let midwayReminders = 0;
    let endingReminders = 0;
    
    for (const sub of trialSubs) {
      const startDate = new Date(sub.fecha_inicio);
      const endDate = new Date(sub.fecha_expiracion);
      const daysActive = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
      
      // Obtener usuario
      const users = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
      if (users.length === 0) continue;
      const user = users[0];
      
      // Obtener perfil profesional
      const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: sub.user_id });
      const userName = profiles[0]?.business_name || user.full_name || user.email.split('@')[0];
      
      // RECORDATORIO MITAD DE PRUEBA (día 30)
      if (daysActive === 30 && daysLeft > 1) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `⏰ ${userName}, te quedan ${daysLeft} días de prueba en MisAutónomos`,
          body: generateMidwayEmail(userName, daysLeft),
          from_name: "MisAutónomos"
        });
        midwayReminders++;
        console.log(`✅ Recordatorio mitad enviado a ${user.email}`);
      }
      
      // AVISO FIN DE PRUEBA (1 día antes)
      if (daysLeft === 1) {
        const formattedEndDate = endDate.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `⚠️ ${userName}, tu prueba gratuita termina mañana`,
          body: generateEndingEmail(userName, formattedEndDate, sub.plan_precio || 33),
          from_name: "MisAutónomos"
        });
        endingReminders++;
        console.log(`✅ Aviso fin de prueba enviado a ${user.email}`);
      }
    }
    
    console.log(`📬 Recordatorios mitad: ${midwayReminders}, Avisos fin: ${endingReminders}`);
    
    return Response.json({
      ok: true,
      midwayReminders,
      endingReminders,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error enviando recordatorios:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});

function generateMidwayEmail(userName, daysLeft) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 64px; height: 64px; margin: 0 auto 16px; }
    .logo img { width: 100%; height: 100%; border-radius: 12px; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 15px; }
    .content { padding: 40px 32px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 700; }
    .message { color: #4b5563; line-height: 1.7; font-size: 16px; margin-bottom: 24px; }
    .highlight-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .highlight-box h3 { color: #b45309; margin: 0 0 8px 0; font-size: 17px; }
    .highlight-box p { color: #78350f; margin: 4px 0; font-size: 14px; }
    .features { margin: 24px 0; list-style: none; padding: 0; }
    .features li { color: #4b5563; margin-bottom: 10px; padding-left: 24px; position: relative; line-height: 1.5; font-size: 15px; }
    .features li:before { content: '✓'; position: absolute; left: 0; color: #10b981; font-weight: bold; }
    .cta { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 28px; text-align: center; font-size: 13px; line-height: 1.6; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><img src="${LOGO_URL}" alt="MisAutónomos" /></div>
      <h1>⏰ Te quedan ${daysLeft} días de prueba</h1>
      <p>Aprovecha al máximo tu perfil</p>
    </div>

    <div class="content">
      <p class="greeting">¡Hola ${userName}!</p>
      
      <p class="message">
        Llevas ya un mes en MisAutónomos. ¿Cómo va todo? Te quedan <strong>${daysLeft} días</strong> de prueba gratuita.
      </p>
      
      <div class="highlight-box">
        <h3>💡 Consejos para conseguir más clientes</h3>
        <p>Los perfiles más completos reciben hasta 3 veces más contactos.</p>
      </div>
      
      <ul class="features">
        <li><strong>Añade fotos de calidad</strong> de tus trabajos realizados</li>
        <li><strong>Completa tu descripción</strong> con tus servicios y experiencia</li>
        <li><strong>Responde rápido</strong> a los mensajes (mejora tu posición)</li>
        <li><strong>Pide valoraciones</strong> a clientes satisfechos</li>
        <li><strong>Mantén tu horario actualizado</strong></li>
      </ul>
      
      <div class="cta">
        <a href="https://misautonomos.es/MyProfile" class="button">
          Optimizar mi perfil →
        </a>
      </div>
      
      <p style="font-size: 13px; color: #6b7280; text-align: center;">
        ¿Dudas? Escríbenos a <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6;">soporte@misautonomos.es</a>
      </p>
    </div>

    <div class="footer">
      <strong style="color: #fff; font-size: 16px;">MisAutónomos</strong><br/>
      <span style="color: #60a5fa; font-style: italic;">Tu autónomo de confianza</span><br/><br/>
      <a href="https://misautonomos.es">misautonomos.es</a> · <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a>
    </div>
  </div>
</body>
</html>
  `;
}

function generateEndingEmail(userName, endDate, monthlyPrice) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 64px; height: 64px; margin: 0 auto 16px; }
    .logo img { width: 100%; height: 100%; border-radius: 12px; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 15px; }
    .content { padding: 40px 32px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 700; }
    .message { color: #4b5563; line-height: 1.7; font-size: 16px; margin-bottom: 24px; }
    .highlight-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .highlight-box h3 { color: #b45309; margin: 0 0 8px 0; font-size: 17px; }
    .highlight-box p { color: #78350f; margin: 4px 0; font-size: 14px; }
    .features { margin: 24px 0; list-style: none; padding: 0; }
    .features li { color: #4b5563; margin-bottom: 10px; padding-left: 24px; position: relative; line-height: 1.5; font-size: 15px; }
    .features li:before { content: '✓'; position: absolute; left: 0; color: #10b981; font-weight: bold; }
    .cta { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
    .info-box { background: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .info-box p { color: #4b5563; margin: 4px 0; font-size: 14px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 28px; text-align: center; font-size: 13px; line-height: 1.6; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><img src="${LOGO_URL}" alt="MisAutónomos" /></div>
      <h1>⚠️ Tu prueba termina mañana</h1>
      <p>Revisa tu suscripción</p>
    </div>

    <div class="content">
      <p class="greeting">Hola ${userName},</p>
      
      <div class="highlight-box">
        <h3>📅 Mañana termina tu periodo de prueba gratuito</h3>
        <p>Tu periodo de prueba de <strong>60 días</strong> finaliza el <strong>${endDate}</strong>.</p>
      </div>
      
      <p class="message"><strong>¿Qué pasará mañana?</strong></p>
      
      <ul class="features">
        <li>Se realizará el primer cobro de <strong>33€/mes</strong> automáticamente</li>
        <li>Tu perfil seguirá visible y activo sin interrupciones</li>
        <li>Continuarás recibiendo mensajes de clientes</li>
      </ul>
      
      <p class="message">
        Si no deseas continuar, puedes cancelar ahora mismo desde tu panel sin ningún coste.
      </p>
      
      <div class="cta">
        <a href="https://misautonomos.es/SubscriptionManagement" class="button">
          Revisar mi suscripción →
        </a>
      </div>
      
      <div class="info-box">
        <p><strong>¿Quieres seguir?</strong> No necesitas hacer nada. Tu suscripción se activará automáticamente a 33€/mes.</p>
      </div>
      
      <p style="font-size: 13px; color: #6b7280; text-align: center;">
        ¿Dudas? <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6;">soporte@misautonomos.es</a>
      </p>
    </div>

    <div class="footer">
      <strong style="color: #fff; font-size: 16px;">MisAutónomos</strong><br/>
      <span style="color: #60a5fa; font-style: italic;">Tu autónomo de confianza</span><br/><br/>
      <a href="https://misautonomos.es">misautonomos.es</a> · <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a>
    </div>
  </div>
</body>
</html>
  `;
}