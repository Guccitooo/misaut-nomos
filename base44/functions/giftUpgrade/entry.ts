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

    // Usar service role para poder actualizar la suscripción de cualquier usuario
    await base44.asServiceRole.entities.Subscription.update(subscriptionId, {
      gifted_plan_id: giftedPlanId,
      gifted_plan_name: giftedPlanName,
      gifted_until: giftedUntil,
      gifted_by_admin_id: user.id,
      gifted_at: new Date().toISOString(),
      gift_reason: giftReason || ''
    });

    console.log(`[giftUpgrade] ✅ Regalo aplicado: sub=${subscriptionId}, plan=${giftedPlanId}, hasta=${giftedUntil}, admin=${user.email}`);
    return Response.json({ ok: true });

  } catch (error) {
    console.error('[giftUpgrade] ❌ Error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});