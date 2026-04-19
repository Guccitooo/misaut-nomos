import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function makeCode(name) {
  const initials = (name || '').trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'PRO';
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MA-${initials}${random}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    if (profile.referral_code) {
      return Response.json({ code: profile.referral_code });
    }

    // Generar código único
    let code;
    let attempts = 0;
    while (attempts < 10) {
      code = makeCode(profile.business_name);
      const existing = await base44.asServiceRole.entities.ProfessionalProfile.filter({ referral_code: code });
      if (existing.length === 0) break;
      attempts++;
    }

    await base44.entities.ProfessionalProfile.update(profile.id, { referral_code: code });
    return Response.json({ code });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});