import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STRIPE_API = 'https://api.stripe.com/v1';

/**
 * Aplica recompensa en Stripe para el referidor.
 * - Trial activo → extiende trial_end 30 días
 * - Activo (pagando) → crédito negativo en customer balance
 */
async function applyInStripe(stripeKey, stripeSubscriptionId, stripeCustomerId) {
  const subRes = await fetch(`${STRIPE_API}/subscriptions/${stripeSubscriptionId}`, {
    headers: { 'Authorization': `Bearer ${stripeKey}` }
  });
  const stripeSub = await subRes.json();
  if (stripeSub.error) throw new Error(stripeSub.error.message);

  const thirtyDays = 30 * 24 * 60 * 60;

  if (stripeSub.status === 'trialing' && stripeSub.trial_end) {
    const newTrialEnd = stripeSub.trial_end + thirtyDays;
    const res = await fetch(`${STRIPE_API}/subscriptions/${stripeSubscriptionId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'trial_end': String(newTrialEnd),
        'proration_behavior': 'none',
        'metadata[last_referral_reward]': new Date().toISOString(),
        'metadata[referral_rewards_count]': String((parseInt(stripeSub.metadata?.referral_rewards_count || '0')) + 1)
      })
    });
    const updated = await res.json();
    if (updated.error) throw new Error(updated.error.message);
    return { success: true, method: 'trial_extended', new_trial_end: new Date(newTrialEnd * 1000).toISOString() };
  }

  if (stripeSub.status === 'active') {
    if (!stripeCustomerId) return { success: false, error: 'no_customer_id' };
    const monthlyAmount = stripeSub.items?.data?.[0]?.price?.unit_amount;
    const currency = stripeSub.items?.data?.[0]?.price?.currency || 'eur';
    if (!monthlyAmount) return { success: false, error: 'cannot_determine_amount' };

    const res = await fetch(`${STRIPE_API}/customers/${stripeCustomerId}/balance_transactions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'amount': String(-monthlyAmount),
        'currency': currency,
        'description': 'Recompensa programa de referidos MisAutónomos (1 mes gratis)',
        'metadata[type]': 'referral_reward',
        'metadata[applied_at]': new Date().toISOString()
      })
    });
    const credit = await res.json();
    if (credit.error) throw new Error(credit.error.message);
    return { success: true, method: 'balance_credit', amount_credited: monthlyAmount / 100, currency: currency.toUpperCase(), transaction_id: credit.id };
  }

  return { success: false, error: 'invalid_subscription_status', status: stripeSub.status };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allPending = await base44.asServiceRole.entities.Referral.filter({ status: 'pending' });
    const pending = allPending.filter(r => new Date(r.created_date) <= sevenDaysAgo);

    const results = { qualified: 0, cancelled: 0, stripe_applied: 0, stripe_skipped: 0 };

    for (const ref of pending) {
      // Verificar suscripción activa del referido
      const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: ref.referred_id });
      const sub = subs[0];

      if (!sub || ['cancelado', 'expirado', 'cancelled'].includes(sub.estado)) {
        await base44.asServiceRole.entities.Referral.update(ref.id, { status: 'cancelled' });
        results.cancelled++;
        continue;
      }

      // Suscripción activa del referidor
      const refSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: ref.referrer_id });
      const refSub = refSubs.find(s => ['activo', 'en_prueba'].includes(s.estado));

      // 1. Extender fecha_expiracion en BD (siempre, independiente de Stripe)
      if (refSub) {
        const newExpiry = new Date(new Date(refSub.fecha_expiracion).getTime() + 30 * 24 * 60 * 60 * 1000);
        await base44.asServiceRole.entities.Subscription.update(refSub.id, {
          fecha_expiracion: newExpiry.toISOString()
        });
      }

      // 2. Aplicar en Stripe si hay clave y stripe_subscription_id
      let stripeResult = { success: false, error: 'not_attempted' };
      if (stripeKey && refSub?.stripe_subscription_id) {
        try {
          stripeResult = await applyInStripe(stripeKey, refSub.stripe_subscription_id, refSub.stripe_customer_id);
          if (stripeResult.success) results.stripe_applied++;
          else results.stripe_skipped++;
        } catch (err) {
          console.error(`Stripe error for referrer ${ref.referrer_id}:`, err.message);
          stripeResult = { success: false, error: 'stripe_api_error', message: err.message };
          results.stripe_skipped++;
        }
      } else {
        results.stripe_skipped++;
        if (!stripeKey) stripeResult.reason = 'STRIPE_SECRET_KEY no configurada';
        else stripeResult.reason = 'stripe_subscription_id no disponible';
      }

      // 3. Actualizar contadores del perfil del referidor
      const refProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: ref.referrer_id });
      let totalMonths = 1;
      if (refProfiles[0]) {
        const p = refProfiles[0];
        totalMonths = (p.referral_months_earned || 0) + 1;
        await base44.asServiceRole.entities.ProfessionalProfile.update(p.id, {
          referral_count: (p.referral_count || 0) + 1,
          referral_months_earned: totalMonths,
        });
      }

      // 4. Marcar Referral con resultado de Stripe
      await base44.asServiceRole.entities.Referral.update(ref.id, {
        status: 'rewarded',
        qualified_at: now.toISOString(),
        rewarded_at: now.toISOString(),
        reward_month_applied_to_referrer: true,
        stripe_reward_applied: stripeResult.success === true,
        stripe_reward_method: stripeResult.method || null,
        stripe_reward_details: JSON.stringify(stripeResult)
      });

      // 5. Email al referidor con mensaje adaptado al método Stripe
      if (ref.referrer_email) {
        const newExpiryStr = refSub
          ? new Date(new Date(refSub.fecha_expiracion).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')
          : '';

        let stripeInfo = '';
        if (stripeResult.success && stripeResult.method === 'trial_extended') {
          stripeInfo = `<p style="color:#065F46;">✓ Tu periodo de prueba en Stripe se ha extendido 30 días automáticamente.</p>`;
        } else if (stripeResult.success && stripeResult.method === 'balance_credit') {
          stripeInfo = `<p style="color:#065F46;">✓ Se ha aplicado un descuento de ${stripeResult.amount_credited}${stripeResult.currency} en tu próxima factura de Stripe.</p>`;
        } else {
          stripeInfo = `<p style="color:#065F46;">✓ Se han añadido 30 días a tu cuenta. Nueva expiración: ${newExpiryStr}.</p>`;
        }

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ref.referrer_email,
          subject: '🎉 ¡Has ganado 1 mes gratis en MisAutónomos!',
          body: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8FAFC;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="padding:24px 32px 20px;border-bottom:1px solid #E2E8F0;">
  <span style="font-weight:700;font-size:18px;color:#0F172A;">MisAutónomos</span>
</td></tr>
<tr><td style="padding:32px 32px 8px;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0F172A;">🎉 ¡Has ganado 1 mes gratis!</h1>
  <div style="font-size:15px;line-height:1.6;color:#1E293B;">
    <p>Hola <strong>${ref.referrer_name || ''}</strong>,</p>
    <p><strong>${ref.referred_name || ref.referred_email}</strong> lleva 7 días activo en MisAutónomos. 🎁</p>
    <div style="background:#ECFDF5;border:1px solid #10B981;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#065F46;">Meses gratis acumulados: <strong>${totalMonths}</strong></p>
      ${stripeInfo}
    </div>
    <p>¡Sigue compartiendo tu código — no hay límite!</p>
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px;">
    <tr><td>
      <a href="https://misautonomos.es/referidos" style="display:inline-block;background:#0F172A;color:#fff;font-weight:600;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:10px;">Ver mi programa de referidos</a>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:24px 32px 28px;border-top:1px solid #E2E8F0;background:#FAFBFC;">
  <p style="margin:0;font-size:12px;color:#64748B;">
    Recibes este correo porque tienes una cuenta en <a href="https://misautonomos.es" style="color:#1E40AF;text-decoration:none;">misautonomos.es</a>.<br>
    © ${new Date().getFullYear()} MisAutónomos · <a href="https://misautonomos.es/privacidad" style="color:#64748B;">Privacidad</a> · <a href="https://misautonomos.es/terminos" style="color:#64748B;">Términos</a>
  </p>
</td></tr>
</table></td></tr></table>
</body></html>`,
          from_name: 'MisAutónomos'
        }).catch(() => {});
      }

      results.qualified++;
    }

    return Response.json({ ok: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});