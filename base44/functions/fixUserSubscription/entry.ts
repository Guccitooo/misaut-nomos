import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('🔧 ========== FIX USER SUBSCRIPTION ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return Response.json({ error: 'userId requerido' }, { status: 400 });
    }

    // Obtener suscripción de la BD
    const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
    
    if (subs.length === 0 || !subs[0].stripe_subscription_id) {
      return Response.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    const currentSub = subs[0];
    const stripeSubscriptionId = currentSub.stripe_subscription_id;

    // Obtener suscripción de Stripe
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    
    // Obtener plan actual de la BD
    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: currentSub.plan_id });
    const plan = plans[0];

    if (!plan || !plan.stripe_price_id) {
      return Response.json({ error: 'Plan no encontrado o sin price_id' }, { status: 404 });
    }

    // Verificar si el Price ID en Stripe coincide con el de la BD
    const stripePriceId = stripeSub.items.data[0]?.price?.id;
    
    console.log(`Usuario: ${user.email}`);
    console.log(`Plan actual: ${currentSub.plan_id}`);
    console.log(`Price ID en BD: ${plan.stripe_price_id}`);
    console.log(`Price ID en Stripe: ${stripePriceId}`);

    if (stripePriceId !== plan.stripe_price_id) {
      console.log(`🔧 Actualizando Price ID de ${stripePriceId} a ${plan.stripe_price_id}`);
      
      // Actualizar suscripción en Stripe
      const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
        items: [{
          id: stripeSub.items.data[0].id,
          price: plan.stripe_price_id,
        }],
        proration_behavior: 'none',
        metadata: {
          fixed_at: new Date().toISOString(),
          fixed_by: 'fixUserSubscription'
        }
      });
      
      console.log('✅ Price ID actualizado correctamente');
      
      return Response.json({
        ok: true,
        message: 'Price ID actualizado',
        old_price: stripePriceId,
        new_price: plan.stripe_price_id,
        stripe_subscription_id: stripeSubscriptionId
      });
    } else {
      console.log('✅ Price ID ya es correcto');
      
      return Response.json({
        ok: true,
        message: 'El Price ID ya es correcto',
        price: stripePriceId
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return Response.json({ 
      error: error.message || 'Error al actualizar' 
    }, { status: 500 });
  }
});