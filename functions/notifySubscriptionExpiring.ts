
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ✅ CRON JOB: Notificar suscripciones próximas a expirar
 * 
 * Ejecutar diariamente para avisar a profesionales cuya
 * suscripción expira en 3 días.
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        console.log('⏰ Verificando suscripciones próximas a expirar');
        
        const today = new Date();
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        
        // Obtener todas las suscripciones
        const subscriptions = await base44.asServiceRole.entities.Subscription.list();
        
        let notificationsSent = 0;
        
        for (const subscription of subscriptions) {
            const expirationDate = new Date(subscription.fecha_expiracion);
            
            // Calcular días restantes
            const daysLeft = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            // Solo notificar si quedan exactamente 3 días
            if (daysLeft === 3 && subscription.estado === 'activo') {
                const users = await base44.asServiceRole.entities.User.filter({
                    id: subscription.user_id
                });
                
                const user = users[0];
                if (!user) continue;
                
                await base44.asServiceRole.functions.invoke('createNotification', {
                    userId: user.id,
                    type: 'subscription_expiring',
                    title: '⚠️ Tu suscripción expira pronto',
                    message: `Tu plan ${subscription.plan_nombre} expira en 3 días. Renuévalo para seguir recibiendo clientes.`,
                    link: '/SubscriptionManagement',
                    sendEmail: true,
                    emailSubject: '⚠️ Tu suscripción en Misautónomos expira en 3 días',
                    emailBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .warning-box h3 { color: #92400e; margin: 0 0 15px 0; font-size: 18px; }
    .warning-box p { color: #78350f; margin: 5px 0; font-weight: 500; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⏰</div>
      <h1>Tu suscripción expira pronto</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${user.full_name || user.email},</p>
      
      <div class="warning-box">
        <h3>⚠️ Recordatorio importante</h3>
        <p><strong>Plan actual:</strong> ${subscription.plan_nombre}</p>
        <p><strong>Fecha de expiración:</strong> ${new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}</p>
        <p><strong>Días restantes:</strong> 3 días</p>
      </div>
      
      <p class="message">
        Tu suscripción en <strong>Misautónomos</strong> está a punto de expirar. 
      </p>
      
      <p class="message">
        <strong>¿Qué pasa si no renuevas?</strong>
      </p>
      <ul style="color: #4b5563; line-height: 1.8; margin-bottom: 25px;">
        <li>❌ Tu perfil dejará de ser visible en búsquedas</li>
        <li>❌ Los clientes no podrán contactarte</li>
        <li>❌ Perderás leads y oportunidades de negocio</li>
      </ul>
      
      <p class="message">
        <strong>✅ Si renuevas ahora:</strong> Tu perfil seguirá activo sin interrupciones y continuarás recibiendo contactos de clientes potenciales.
      </p>
      
      <div class="cta">
        <a href="https://misautonomos.es/SubscriptionManagement" class="button">
          Renovar mi suscripción →
        </a>
      </div>
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        ¿Dudas? Contacta con nosotros:<br/>
        <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6; text-decoration: none;">soporte@misautonomos.es</a>
      </p>
    </div>
    
    <div class="footer">
      <strong>Equipo Misautónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
                `
                });
                
                notificationsSent++;
                console.log(`✅ Notificación enviada a ${user.email} - expira en ${daysLeft} días`);
            }
        }
        
        console.log(`📬 Total notificaciones enviadas: ${notificationsSent}`);
        
        return Response.json({
            ok: true,
            notificationsSent,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error notificando expiraciones:', error);
        return Response.json({
            ok: false,
            error: error.message
        }, { status: 500 });
    }
});
