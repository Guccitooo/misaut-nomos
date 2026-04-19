import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { referral_code } = await req.json();
    if (!referral_code) return Response.json({ ok: false, reason: 'no_code' });

    // Verificar que el código existe y pertenece a otro usuario
    const referrerProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ referral_code });
    if (referrerProfiles.length === 0) return Response.json({ ok: false, reason: 'invalid_code' });

    const referrer = referrerProfiles[0];
    if (referrer.user_id === user.id) return Response.json({ ok: false, reason: 'self_referral' });

    // Verificar que el usuario no fue ya referido
    const existing = await base44.asServiceRole.entities.Referral.filter({ referred_id: user.id });
    if (existing.length > 0) return Response.json({ ok: false, reason: 'already_referred' });

    // Extender trial del nuevo usuario 30 días
    const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
    let subId = null;
    if (subs[0]) {
      const newExpiry = new Date(new Date(subs[0].fecha_expiracion).getTime() + 30 * 24 * 60 * 60 * 1000);
      await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
        fecha_expiracion: newExpiry.toISOString()
      });
      subId = subs[0].id;
    }

    // Crear Referral
    await base44.asServiceRole.entities.Referral.create({
      referrer_id: referrer.user_id,
      referrer_name: referrer.business_name || '',
      referrer_email: referrer.email_contacto || '',
      referred_id: user.id,
      referred_name: user.full_name || '',
      referred_email: user.email || '',
      code: referral_code,
      status: 'pending',
      reward_extra_days_applied_to_referred: true,
      referred_subscription_id: subId || '',
    });

    return Response.json({ ok: true, referrer_name: referrer.business_name || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});