/**
 * Helpers centralizados para resolución del plan efectivo (incluye regalos).
 * ÚNICA fuente de verdad para saber qué plan tiene un usuario.
 */

export function getEffectivePlanId(subscription) {
  if (!subscription) return null;
  if (subscription.gifted_plan_id && subscription.gifted_until) {
    if (new Date(subscription.gifted_until) > new Date()) {
      return subscription.gifted_plan_id;
    }
  }
  return subscription.plan_id || null;
}

export function getEffectivePlanName(subscription) {
  if (!subscription) return '';
  if (subscription.gifted_plan_id && subscription.gifted_until) {
    if (new Date(subscription.gifted_until) > new Date()) {
      return subscription.gifted_plan_name || 'Plan Regalado';
    }
  }
  return subscription.plan_nombre || '';
}

export function isGiftActive(subscription) {
  if (!subscription?.gifted_plan_id || !subscription?.gifted_until) return false;
  return new Date(subscription.gifted_until) > new Date();
}

export function isAdsPlusActive(subscription) {
  return getEffectivePlanId(subscription) === 'plan_adsplus';
}