import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const adminUser = await base44.auth.me();
    
    // Verificar que es admin
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { Subscription, User } = await import('@/api/entities');
    const now = new Date();
    
    // Buscar todas las subs con gifted_until en el pasado pero gifted_plan_id aún set
    const all = await Subscription.filter({
      gifted_plan_id: { $ne: '' }
    });
    
    let expired = 0;
    
    for (const sub of all) {
      if (sub.gifted_until && new Date(sub.gifted_until) <= now) {
        const originalPlanName = sub.plan_nombre;
        const giftedPlanName = sub.gifted_plan_name;
        
        // Expirar el regalo
        await Subscription.update(sub.id, {
          gifted_plan_id: '',
          gifted_plan_name: '',
          gifted_until: null
        });
        
        // Notificar al usuario
        try {
          const user = await User.get(sub.user_id);
          
          // Push notification
          try {
            const { sendPush } = await import('@/services/pushNotifications');
            await sendPush({
              userIds: [sub.user_id],
              title: 'Tu regalo ha terminado',
              message: `Tu acceso gratuito a ${giftedPlanName} ha finalizado. Vuelves a tu plan ${originalPlanName}.`,
              url: 'https://misautonomos.es/suscripcion'
            });
          } catch (e) {
            console.error('Error sending push:', e);
          }
          
          // Email
          try {
            const { giftExpiredEmail } = await import('@/services/emails');
            const { sendEmail } = await import('@/api/integrations');
            const lang = user.language || 'es';
            
            await sendEmail({
              to: user.email,
              subject: lang === 'en' 
                ? `Your gift has ended` 
                : `Tu regalo ha finalizado`,
              html: giftExpiredEmail(user, giftedPlanName, originalPlanName, lang)
            });
          } catch (e) {
            console.error('Error sending email:', e);
          }
        } catch (e) {
          console.error('Error notifying user:', e);
        }
        
        expired++;
      }
    }
    
    return Response.json({ expired, message: `${expired} regalos expirados` });
  } catch (error) {
    console.error('Error in expireGiftedPlans:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});