import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, planPrice } = await req.json();

    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: planId });
    const plan = plans[0];

    if (!plan) {
      return Response.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const baseUrl = req.headers.get('origin') || 'https://misautonomos.es';

    const interval = plan.duracion_dias === 30 ? 'month' : plan.duracion_dias === 90 ? 'month' : 'year';
    const intervalCount = plan.duracion_dias === 90 ? 3 : 1;

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      success_url: `${baseUrl}/ProfileOnboarding?payment=success`,
      cancel_url: `${baseUrl}/PricingPlans?canceled=true`,
      metadata: {
        user_id: user.id,
        email: user.email,
        planId: planId,
      },
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: plan.nombre,
            description: plan.descripcion || '',
          },
          unit_amount: planPrice * 100,
          recurring: {
            interval: interval,
            interval_count: intervalCount
          }
        },
        quantity: 1
      }],
      subscription_data: {
        trial_period_days: 60,
        metadata: {
          user_id: user.id,
          email: user.email,
          planId: planId,
        }
      }
    });

    return Response.json({ url: session.url });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});