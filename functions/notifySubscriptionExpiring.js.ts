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
            const daysLeft = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
            
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
                    title: '⏰ Tu suscripción expira pronto',
                    message: `Tu suscripción ${subscription.plan_nombre} expira en 3 días. Renueva ahora para seguir visible.`,
                    link: '/SubscriptionManagement',
                    priority: 'high',
                    sendEmail: true,
                    emailSubject: '⏰ Tu suscripción en milautonomos expira en 3 días',
                    emailBody: `Hola ${user.full_name || ''},

Tu suscripción ${subscription.plan_nombre} en milautonomos expira en 3 días (${expirationDate.toLocaleDateString('es-ES')}).

Si no renuevas antes de esa fecha:
- Tu perfil dejará de aparecer en las búsquedas
- No podrás recibir nuevos contactos de clientes
- Perderás tu posicionamiento actual

👉 Renovar ahora: https://milautonomos.com/SubscriptionManagement

Precio: ${subscription.plan_precio}€

¿Necesitas ayuda? Responde a este email.

Gracias,
Equipo milautonomos`
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