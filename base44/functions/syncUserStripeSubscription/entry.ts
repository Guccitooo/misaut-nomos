import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('🔄 ========== SYNC USER STRIPE SUBSCRIPTION ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Obtener todas las suscripciones de la BD
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({});
    
    console.log(`📊 Suscripciones encontradas: ${subscriptions.length}`);
    
    const updated = [];
    const errors = [];
    
    for (const sub of subscriptions) {
      if (!sub.stripe_subscription_id) {
        console.log(`⚠️  ${sub.user_id}: Sin stripe_subscription_id`);
        continue;
      }
      
      try {
        // Obtener suscripción de Stripe
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        
        // Obtener plan actual de la BD
        const currentPlanId = sub.plan_id;
        const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: currentPlanId });
        const plan = plans[0];
        
        if (!plan || !plan.stripe_price_id) {
          console.log(`⚠️  ${sub.user_id}: Plan no encontrado o sin price_id`);
          continue;
        }
        
        // Verificar si el Price ID en Stripe coincide con el de la BD
        const stripePriceId = stripeSub.items.data[0]?.price?.id;
        
        if (stripePriceId !== plan.stripe_price_id) {
          console.log(`🔧 ${sub.user_id}: Actualizando Price ID de ${stripePriceId} a ${plan.stripe_price_id}`);
          
          // Actualizar suscripción en Stripe
          await stripe.subscriptions.update(sub.stripe_subscription_id, {
            items: [{
              id: stripeSub.items.data[0].id,
              price: plan.stripe_price_id,
            }],
            proration_behavior: 'none', // Sin prorrateo para sync
            metadata: {
              synced_at: new Date().toISOString(),
              synced_by: 'syncUserStripeSubscription'
            }
          });
          
          updated.push({
            user_id: sub.user_id,
            old_price: stripePriceId,
            new_price: plan.stripe_price_id
          });
        } else {
          console.log(`✅ ${sub.user_id}: Price ID correcto`);
        }
      } catch (error) {
        console.error(`❌ ${sub.user_id}: ${error.message}`);
        errors.push({ user_id: sub.user_id, error: error.message });
      }
    }
    
    return Response.json({
      ok: true,
      message: 'Sincronización completada',
      updated,
      errors
    });

  } catch (error) {
    console.error('❌ Error general:', error.message);
    return Response.json({ 
      error: error.message || 'Error al sincronizar' 
    }, { status: 500 });
  }
});