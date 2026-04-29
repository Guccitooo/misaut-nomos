import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAX_MONTHS = 12;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { event, data, old_data } = payload;

    if (event?.type !== 'update') return Response.json({ ok: true, skipped: 'not_update' });

    // Solo disparar cuando pasa a "activo" (pagado) desde otro estado
    const isNowActive = data?.estado === 'activo';
    const wasNotActive = old_data?.estado !== 'activo';
    // Ignorar planes regalados
    const isGifted = !!data?.gifted_plan_id;

    if (!isNowActive || !wasNotActive || isGifted) {
      return Response.json({ ok: true, skipped: 'not_relevant_transition' });
    }

    const base44 = createClientFromRequest(req);
    const userId = data.user_id;
    if (!userId) return Response.json({ ok: true, skipped: 'no_user_id' });

    // Buscar perfil del referido
    const refProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: userId });
    const refProfile = refProfiles[0];
    if (!refProfile?.referred_by_code) {
      return Response.json({ ok: true, skipped: 'no_referred_by_code' });
    }

    // Buscar el Referral pendiente
    const referrals = await base44.asServiceRole.entities.Referral.filter({ referred_id: userId });
    const referral = referrals.find(r => r.status === 'pending');
    if (!referral) return Response.json({ ok: true, skipped: 'no_pending_referral' });

    // Buscar el referrer
    const referrerProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ referral_code: refProfile.referred_by_code });
    const referrerProfile = referrerProfiles[0];
    if (!referrerProfile) return Response.json({ ok: true, skipped: 'referrer_not_found' });

    // Verificar límite de 12 meses
    const currentMonths = referrerProfile.referral_months_earned || 0;
    if (currentMonths >= MAX_MONTHS) {
      await base44.asServiceRole.entities.Referral.update(referral.id, { status: 'cancelled' });
      return Response.json({ ok: true, skipped: 'max_months_reached' });
    }

    const now = new Date();

    // 1. Actualizar contadores del referrer
    await base44.asServiceRole.entities.ProfessionalProfile.update(referrerProfile.id, {
      referral_count: (referrerProfile.referral_count || 0) + 1,
      referral_months_earned: currentMonths + 1,
    });

    // 2. Extender suscripción del referrer +30 días
    const refSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: referrerProfile.user_id });
    const refSub = refSubs.find(s => ['activo', 'en_prueba'].includes(s.estado));
    if (refSub) {
      const currentExpiry = new Date(refSub.fecha_expiracion);
      const newExpiry = new Date(Math.max(currentExpiry.getTime(), now.getTime()) + 30 * 24 * 60 * 60 * 1000);
      await base44.asServiceRole.entities.Subscription.update(refSub.id, {
        fecha_expiracion: newExpiry.toISOString(),
      });
      await base44.asServiceRole.entities.ProfessionalProfile.update(referrerProfile.id, {
        referral_months_used: (referrerProfile.referral_months_used || 0) + 1,
      });
    }

    // 3. Marcar Referral como rewarded
    await base44.asServiceRole.entities.Referral.update(referral.id, {
      status: 'rewarded',
      qualified_at: now.toISOString(),
      rewarded_at: now.toISOString(),
      reward_month_applied_to_referrer: true,
      referred_name: refProfile.business_name || '',
    });

    // 4. Notificación in-app al referrer
    const referredName = refProfile.business_name || 'Un usuario';
    await base44.asServiceRole.entities.Notification.create({
      user_id: referrerProfile.user_id,
      type: 'system_update',
      title: '🎉 ¡Has ganado 1 mes gratis!',
      message: `${referredName} se ha suscrito con tu código. Se ha añadido 1 mes a tu cuenta.`,
      link: '/referidos',
      priority: 'high',
    });

    // 5. Email al referrer
    if (referral.referrer_email) {
      const newMonths = currentMonths + 1;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: referral.referrer_email,
        subject: '🎉 ¡Has ganado 1 mes gratis en MisAutónomos!',
        body: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#F8FAFC;"><tr><td align="center">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="padding:24px 32px 20px;border-bottom:1px solid #E2E8F0;">
  <strong style="font-size:18px;color:#0F172A;">MisAutónomos</strong>
</td></tr>
<tr><td style="padding:32px;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0F172A;">🎉 ¡Has ganado 1 mes gratis!</h1>
  <p style="color:#1E293B;">Hola <strong>${referrerProfile.business_name || ''}</strong>,</p>
  <p style="color:#1E293B;"><strong>${referredName}</strong> acaba de suscribirse con tu código. ¡Felicidades! 🎁</p>
  <div style="background:#ECFDF5;border:1px solid #10B981;border-radius:10px;padding:16px;margin:16px 0;">
    <p style="margin:0;color:#065F46;font-weight:600;">Meses gratis acumulados: ${newMonths} / ${MAX_MONTHS}</p>
    <p style="margin:8px 0 0;color:#065F46;">Se han añadido 30 días extra a tu suscripción automáticamente.</p>
  </div>
  <a href="https://misautonomos.es/referidos" style="display:inline-block;background:#0F172A;color:#fff;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;margin-top:16px;">Ver mis referidos</a>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #E2E8F0;background:#FAFBFC;">
  <p style="margin:0;font-size:12px;color:#64748B;">© ${new Date().getFullYear()} MisAutónomos</p>
</td></tr>
</table></td></tr></table>
</body></html>`,
        from_name: 'MisAutónomos',
      }).catch(() => {});
    }

    return Response.json({ ok: true, referrer_id: referrerProfile.user_id, months_earned: currentMonths + 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});