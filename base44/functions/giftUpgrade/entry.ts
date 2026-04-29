import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { subscriptionId, giftedPlanId, giftedPlanName, giftedUntil, giftReason } = await req.json();

    if (!subscriptionId || !giftedPlanId || !giftedUntil) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Leer la suscripción actual para el audit log
    const sub = await base44.asServiceRole.entities.Subscription.get(subscriptionId);

    // Calcular fecha_expiracion: max(actual, gifted_until)
    const giftedUntilDate = new Date(giftedUntil);
    const currentExpiration = sub.fecha_expiracion ? new Date(sub.fecha_expiracion) : new Date(0);
    const newExpiration = giftedUntilDate > currentExpiration ? giftedUntilDate : currentExpiration;

    // Actualizar suscripción con el regalo + asegurar estado activo y fecha_expiracion extendida
    await base44.asServiceRole.entities.Subscription.update(subscriptionId, {
      gifted_plan_id: giftedPlanId,
      gifted_plan_name: giftedPlanName,
      gifted_until: giftedUntil,
      gifted_by_admin_id: user.id,
      gifted_at: new Date().toISOString(),
      gift_reason: giftReason || '',
      estado: 'activo',
      fecha_expiracion: newExpiration.toISOString(),
    });

    // Guardar en el registro de auditoría
    try {
      // Obtener email del usuario afectado
      const targetUsers = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
      const targetUser = targetUsers?.[0];

      await base44.asServiceRole.entities.PlanAuditLog.create({
        user_id: sub.user_id,
        user_email: targetUser?.email || sub.user_id,
        changed_by_id: user.id,
        changed_by_email: user.email,
        change_type: 'gift_upgrade',
        plan_before: sub.plan_id,
        plan_before_name: sub.plan_nombre,
        plan_after: giftedPlanId,
        plan_after_name: giftedPlanName,
        reason: giftReason || '',
        valid_until: giftedUntil,
        subscription_id: subscriptionId
      });
      console.log(`[giftUpgrade] ✅ Audit log guardado para user=${sub.user_id}`);
    } catch (e) {
      console.error('[giftUpgrade] ❌ Error guardando audit log:', e.message);
    }

    // Crear notificación para el usuario receptor del regalo
    try {
      const targetUsers = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
      const targetUser = targetUsers?.[0];
      const adminName = user.full_name || user.email;
      const formattedDate = new Date(giftedUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

      await base44.asServiceRole.entities.Notification.create({
        user_id: sub.user_id,
        type: 'profile_approved',
        title: `🎁 Regalo activado: ${giftedPlanName}`,
        message: `${adminName} te ha regalado ${giftedPlanName} hasta el ${formattedDate}.${giftReason ? ' Motivo: ' + giftReason : ''}`,
        is_read: false,
        priority: 'high'
      });
      console.log(`[giftUpgrade] ✅ Notificación enviada a user=${sub.user_id}`);
    } catch (e) {
      console.error('[giftUpgrade] ❌ Error creando notificación:', e.message);
    }

    console.log(`[giftUpgrade] ✅ Regalo aplicado: sub=${subscriptionId}, plan=${giftedPlanId}, hasta=${giftedUntil}, admin=${user.email}, estado→activo, expiracion→${newExpiration.toISOString()}`);
    return Response.json({ ok: true });

  } catch (error) {
    console.error('[giftUpgrade] ❌ Error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});