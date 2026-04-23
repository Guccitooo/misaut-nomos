/**
 * Helpers para gestionar suscripciones y detectar planes regalados.
 * Para nueva lógica de features, usar utils/planHelpers.js
 */

export async function getEffectivePlan(userId) {
  if (!userId) return null;
  
  try {
    const { base44 } = await import('@/api/base44Client');
    const result = await base44.entities.Subscription.filter({ user_id: userId });
    const subs = Array.isArray(result) ? result : [];
    
    if (subs.length === 0) return null;
    
    const sub = subs[0];
    if (!sub) return null;
    
    // Verificar que la suscripción está activa
    const estado = sub.estado?.toLowerCase();
    const fechaExp = sub.fecha_expiracion ? new Date(sub.fecha_expiracion) : null;
    const now = new Date();
    
    const isActive = fechaExp && (estado === 'activo' || estado === 'en_prueba') && fechaExp >= now;
    const isCanceledButValid = fechaExp && (estado === 'cancelado') && fechaExp >= now;
    
    if (!isActive && !isCanceledButValid) return null;
    
    // Si tiene regalo activo
    if (sub.gifted_plan_id && sub.gifted_until && new Date(sub.gifted_until) > now) {
      return {
        planId: sub.gifted_plan_id,
        planName: sub.gifted_plan_name || sub.gifted_plan_id,
        isGifted: true,
        giftedUntil: sub.gifted_until,
        originalPlanId: sub.plan_id,
        originalPlanName: sub.plan_nombre || sub.plan_id,
        subscription: sub
      };
    }
    
    return {
      planId: sub.plan_id,
      planName: sub.plan_nombre || sub.plan_id,
      isGifted: false,
      subscription: sub
    };
  } catch (error) {
    console.error('[getEffectivePlan] Error:', error.message);
    return null;
  }
}

export async function getUserPlan(userId) {
  const effective = await getEffectivePlan(userId);
  return effective?.planId || null;
}

export function isAdsPlus(planIdOrEffectivePlan) {
  // Soporta tanto string (planId) como objeto (effectivePlan)
  if (!planIdOrEffectivePlan) return false;
  const planId = typeof planIdOrEffectivePlan === 'string' 
    ? planIdOrEffectivePlan 
    : planIdOrEffectivePlan?.planId;
  return planId === 'plan_adsplus';
}

export function isVisibility(effectivePlan) {
  return effectivePlan?.planId === 'plan_visibility';
}

export function hasActiveSubscription(subscription) {
  if (!subscription) return false;
  
  const estado = subscription.estado?.toLowerCase();
  const fechaExp = new Date(subscription.fecha_expiracion);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  fechaExp.setHours(0, 0, 0, 0);
  
  const isActiveSubscription = (
    estado === 'activo' || 
    estado === 'active' || 
    estado === 'en_prueba' || 
    estado === 'trialing' ||
    estado === 'trial_active'
  ) && fechaExp >= today;
  
  const isCanceledButValid = (
    estado === 'cancelado' || 
    estado === 'canceled'
  ) && fechaExp >= today;
  
  return isActiveSubscription || isCanceledButValid;
}