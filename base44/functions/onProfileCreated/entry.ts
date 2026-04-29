import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I

function makeCode() {
  let code = 'MA-';
  for (let i = 0; i < 6; i++) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return code;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { event, data } = payload;

    if (event?.type !== 'create') return Response.json({ ok: true, skipped: 'not_create' });
    if (!data?.id) return Response.json({ ok: true, skipped: 'no_data' });
    if (data.referral_code) return Response.json({ ok: true, skipped: 'already_has_code' });

    const base44 = createClientFromRequest(req);

    let code;
    let attempts = 0;
    while (attempts < 20) {
      code = makeCode();
      const existing = await base44.asServiceRole.entities.ProfessionalProfile.filter({ referral_code: code });
      if (existing.length === 0) break;
      attempts++;
    }

    await base44.asServiceRole.entities.ProfessionalProfile.update(data.id, { referral_code: code });

    // Si el nuevo perfil tiene referred_by_code, crear el registro Referral
    if (data.referred_by_code && data.user_id) {
      const referrers = await base44.asServiceRole.entities.ProfessionalProfile.filter({ referral_code: data.referred_by_code });
      if (referrers.length > 0) {
        const referrer = referrers[0];
        // Evitar duplicados
        const existing = await base44.asServiceRole.entities.Referral.filter({ referred_id: data.user_id });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Referral.create({
            referrer_id: referrer.user_id,
            referrer_name: referrer.business_name || '',
            referred_id: data.user_id,
            code: data.referred_by_code,
            status: 'pending',
          });
        }
      }
    }

    return Response.json({ ok: true, code });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});