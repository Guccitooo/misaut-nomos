/**
 * syncAdsPlusStatus — llamada por giftUpgrade y onSubscriptionActivated.
 * Evalúa si el usuario tiene Plan Ads+ activo (pagado o regalado),
 * actualiza is_ads_plus en ProfessionalProfile,
 * y si is_ads_plus es true y el perfil tiene onboarding completado → activa el perfil.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function isAdsPlusActive(sub) {
  if (!sub) return false;
  const now = new Date();

  // Caso A: plan pagado
  const isActivePaid = sub.plan_id === 'plan_adsplus'
    && ['activo', 'en_prueba'].includes(sub.estado)
    && new Date(sub.fecha_expiracion) > now;

  // Caso B: regalo activo
  const isGifted = sub.gifted_plan_id === 'plan_adsplus'
    && sub.gifted_until
    && new Date(sub.gifted_until) > now;

  return isActivePaid || isGifted;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Obtener suscripción del usuario
    const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
    const sub = subs[0] || null;
    const hasAdsPlus = isAdsPlusActive(sub);

    // Obtener perfil
    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: userId });
    const profile = profiles[0];
    if (!profile) {
      return Response.json({ ok: true, skipped: 'no_profile', is_ads_plus: hasAdsPlus });
    }

    const updates = { is_ads_plus: hasAdsPlus };

    // Si acaba de ganar Ads+ y tiene onboarding completado → activar perfil automáticamente
    if (hasAdsPlus && profile.onboarding_completed && !profile.visible_en_busqueda) {
      updates.visible_en_busqueda = true;
      updates.estado_perfil = 'activo';
      console.log(`[syncAdsPlusStatus] Activando perfil de user=${userId} por Plan Ads+`);
    }

    await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, updates);

    console.log(`[syncAdsPlusStatus] user=${userId} is_ads_plus=${hasAdsPlus}`);
    return Response.json({ ok: true, is_ads_plus: hasAdsPlus, profile_activated: !!updates.visible_en_busqueda });
  } catch (error) {
    console.error('[syncAdsPlusStatus] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});