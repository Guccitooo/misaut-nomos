import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('[BillingPortal] START request');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      console.log('[BillingPortal] ❌ No authenticated user');
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[BillingPortal] User:', user.email, 'ID:', user.id);
    
    // Obtener stripe_customer_id desde la Subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id
    });
    
    if (!subs || subs.length === 0) {
      console.log('[BillingPortal] ❌ No subscription found');
      return Response.json({ ok: false, error: 'No subscription found' }, { status: 400 });
    }
    
    const sub = subs[0];
    if (!sub.stripe_customer_id) {
      console.log('[BillingPortal] ❌ No stripe_customer_id in subscription');
      return Response.json({ ok: false, error: 'No Stripe customer ID' }, { status: 400 });
    }
    
    console.log('[BillingPortal] Customer ID:', sub.stripe_customer_id);
    
    // Crear sesión del portal de billing
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: 'https://misautonomos.es/suscripcion'
    });
    
    console.log('[BillingPortal] ✅ Portal session created:', session.url);
    return Response.json({ ok: true, url: session.url });
    
  } catch (error) {
    console.error('[BillingPortal] ❌ Error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});