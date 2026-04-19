/**
 * Helpers para gestionar suscripciones y detectar planes
 */

export async function getUserPlan(userId) {
  if (!userId) return null;
  
  try {
    const { Subscription } = await import('@/api/entities');
    const subs = await Subscription.filter({
      user_id: userId,
      estado: { $in: ['activo', 'en_prueba'] }
    }).limit(1);
    
    return subs[0]?.plan_id || null;
  } catch (error) {
    console.error('Error getting user plan:', error);
    return null;
  }
}

export function isAdsPlus(planId) {
  return planId === 'plan_adsplus';
}

export function isVisibility(planId) {
  return planId === 'plan_visibility';
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