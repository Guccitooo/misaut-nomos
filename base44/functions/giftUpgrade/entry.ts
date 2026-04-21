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

    // Actualizar suscripción con el regalo
    await base44.asServiceRole.entities.Subscription.update(subscriptionId, {
      gifted_plan_id: giftedPlanId,
      gifted_plan_name: giftedPlanName,
      gifted_until: giftedUntil,
      gifted_by_admin_id: user.id,
      gifted_at: new Date().toISOString(),
      gift_reason: giftReason || ''
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

    console.log(`[giftUpgrade] ✅ Regalo aplicado: sub=${subscriptionId}, plan=${giftedPlanId}, hasta=${giftedUntil}, admin=${user.email}`);
    return Response.json({ ok: true });

  } catch (error) {
    console.error('[giftUpgrade] ❌ Error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});