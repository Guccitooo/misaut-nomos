import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();

    // Buscar todas las suscripciones con gifted_plan_id activo
    const all = await base44.asServiceRole.entities.Subscription.filter({ gifted_plan_id: { $ne: '' } });

    let expired = 0;

    for (const sub of all) {
      if (!sub.gifted_until || new Date(sub.gifted_until) > now) continue;

      const giftedPlanName = sub.gifted_plan_name || 'plan regalo';
      const originalPlanName = sub.plan_nombre || 'tu plan';

      // Expirar el regalo
      await base44.asServiceRole.entities.Subscription.update(sub.id, {
        gifted_plan_id: '',
        gifted_plan_name: '',
        gifted_until: null
      });

      console.log(`[expireGiftedPlans] ✅ Regalo expirado: sub=${sub.id}, user=${sub.user_id}`);

      // Notificación interna
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: sub.user_id,
          type: 'system_update',
          title: 'Tu regalo ha terminado',
          message: `Tu acceso gratuito a ${giftedPlanName} ha finalizado. Sigues con tu plan ${originalPlanName}.`,
          link: '/suscripcion',
          is_read: false,
          priority: 'medium'
        });
      } catch (e) {
        console.error(`[expireGiftedPlans] ❌ Error creando notificación para ${sub.user_id}:`, e.message);
      }

      // Email via Core integration
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
        const user = users?.[0];
        if (user?.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: `Tu regalo de ${giftedPlanName} ha finalizado - MisAutónomos`,
            body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #374151;">Tu regalo ha finalizado</h2>
  <p>Hola ${user.full_name || ''},</p>
  <p>Tu acceso gratuito al <strong>${giftedPlanName}</strong> ha finalizado. A partir de ahora vuelves a tu plan <strong>${originalPlanName}</strong>.</p>
  <p>Si quieres seguir disfrutando de las funcionalidades premium, puedes actualizar tu plan desde tu <a href="https://misautonomos.es/suscripcion" style="color: #2563eb;">panel de suscripción</a>.</p>
  <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">El equipo de MisAutónomos</p>
</div>
            `
          });
          console.log(`[expireGiftedPlans] ✅ Email enviado a ${user.email}`);
        }
      } catch (e) {
        console.error(`[expireGiftedPlans] ❌ Error enviando email:`, e.message);
      }

      expired++;
    }

    console.log(`[expireGiftedPlans] ✅ Total expirados: ${expired}`);
    return Response.json({ expired, message: `${expired} regalos expirados` });
  } catch (error) {
    console.error('[expireGiftedPlans] ❌ Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});