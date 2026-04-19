/**
 * Helpers para gestionar suscripciones y detectar planes regalados
 */

export async function getEffectivePlan(userId) {
  if (!userId) return null;
  
  try {
    const { Subscription } = await import('@/api/entities');
    const subs = await Subscription.filter({
      user_id: userId,
      estado: { $in: ['activo', 'en_prueba'] }
    }).limit(1);
    
    if (!subs[0]) return null;
    
    const sub = subs[0];
    const now = new Date();
    
    // Si tiene regalo activo
    if (sub.gifted_plan_id && sub.gifted_until && new Date(sub.gifted_until) > now) {
      return {
        planId: sub.gifted_plan_id,
        planName: sub.gifted_plan_name,
        isGifted: true,
        giftedUntil: sub.gifted_until,
        originalPlanId: sub.plan_id,
        originalPlanName: sub.plan_nombre,
        subscription: sub
      };
    }
    
    return {
      planId: sub.plan_id,
      planName: sub.plan_nombre,
      isGifted: false,
      subscription: sub
    };
  } catch (error) {
    console.error('Error getting effective plan:', error);
    return null;
  }
}

export async function getUserPlan(userId) {
  const effective = await getEffectivePlan(userId);
  return effective?.planId || null;
}

export function isAdsPlus(effectivePlan) {
  return effectivePlan?.planId === 'plan_adsplus';
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