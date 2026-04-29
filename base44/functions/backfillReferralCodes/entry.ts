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
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const allProfiles = await base44.asServiceRole.entities.ProfessionalProfile.list();
    const withoutCode = allProfiles.filter(p => !p.referral_code);

    let updated = 0;
    for (const profile of withoutCode) {
      let code;
      let attempts = 0;
      while (attempts < 20) {
        code = makeCode();
        const existing = await base44.asServiceRole.entities.ProfessionalProfile.filter({ referral_code: code });
        if (existing.length === 0) break;
        attempts++;
      }
      await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, { referral_code: code });
      updated++;
    }

    return Response.json({ ok: true, updated, total: allProfiles.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});