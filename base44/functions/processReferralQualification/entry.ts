import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allPending = await base44.asServiceRole.entities.Referral.filter({ status: 'pending' });
    const pending = allPending.filter(r => new Date(r.created_date) <= sevenDaysAgo);

    const results = { qualified: 0, cancelled: 0 };

    for (const ref of pending) {
      // Verificar suscripción activa del referido
      const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: ref.referred_id });
      const sub = subs[0];

      if (!sub || ['cancelado', 'expirado', 'cancelled'].includes(sub.estado)) {
        await base44.asServiceRole.entities.Referral.update(ref.id, { status: 'cancelled' });
        results.cancelled++;
        continue;
      }

      // Extender suscripción del referidor 30 días
      const refSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: ref.referrer_id });
      const refSub = refSubs.find(s => ['activo', 'en_prueba'].includes(s.estado));

      if (refSub) {
        const newExpiry = new Date(new Date(refSub.fecha_expiracion).getTime() + 30 * 24 * 60 * 60 * 1000);
        await base44.asServiceRole.entities.Subscription.update(refSub.id, {
          fecha_expiracion: newExpiry.toISOString()
        });
      }

      // Actualizar contadores del perfil del referidor
      const refProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: ref.referrer_id });
      if (refProfiles[0]) {
        const p = refProfiles[0];
        const totalMonths = (p.referral_months_earned || 0) + 1;
        await base44.asServiceRole.entities.ProfessionalProfile.update(p.id, {
          referral_count: (p.referral_count || 0) + 1,
          referral_months_earned: totalMonths,
        });

        // Email al referidor
        if (ref.referrer_email) {
          const newExpiryStr = refSub
            ? new Date(new Date(refSub.fecha_expiracion).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')
            : '';

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
  <div style="background:#ECFDF5;border-left:3px solid #10B981;padding:12px 16px;border-radius:8px;margin-bottom:20px;">
    <span style="color:#10B981;font-weight:700;margin-right:6px;">✓</span>
  </div>
  <div style="font-size:15px;line-height:1.6;color:#1E293B;">
    <p>Hola <strong>${ref.referrer_name || ''}</strong>,</p>
    <p><strong>${ref.referred_name || ref.referred_email}</strong> se ha unido a MisAutónomos usando tu código. 🎁</p>
    <p>Hemos añadido <strong>1 mes gratis</strong> a tu suscripción.</p>
    <div style="background:#ECFDF5;border:1px solid #10B981;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#065F46;">Meses gratis acumulados: <strong>${totalMonths}</strong></p>
      ${newExpiryStr ? `<p style="margin:4px 0 0;color:#065F46;font-size:13px;">Nueva fecha de expiración: ${newExpiryStr}</p>` : ''}
    </div>
    <p>¡Sigue compartiendo tu código — no hay límite!</p>
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px;">
    <tr><td>
      <a href="https://misautonomos.es/referidos" style="display:inline-block;background:#0F172A;color:#fff;font-weight:600;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:10px;">Compartir mi link</a>
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
      }

      // Marcar como rewarded
      await base44.asServiceRole.entities.Referral.update(ref.id, {
        status: 'rewarded',
        qualified_at: now.toISOString(),
        rewarded_at: now.toISOString(),
        reward_month_applied_to_referrer: true,
      });

      results.qualified++;
    }

    return Response.json({ ok: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});