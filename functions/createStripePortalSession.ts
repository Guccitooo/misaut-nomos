import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('🔐 ========== CREAR STRIPE PORTAL SESSION ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 Usuario:', user.email);

    // ✅ OBTENER SUSCRIPCIÓN DEL USUARIO
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id
    });

    if (subs.length === 0 || !subs[0].stripe_customer_id) {
      return Response.json({ 
        error: 'No tienes suscripción activa o no está vinculada a Stripe' 
      }, { status: 404 });
    }

    const subscription = subs[0];
    const customerId = subscription.stripe_customer_id;

    console.log('✅ Customer ID:', customerId);

    // ✅ CREAR PORTAL SESSION
    const baseUrl = req.headers.get('origin') || 'https://misautonomos.es';
    const returnUrl = `${baseUrl}/SubscriptionManagement`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log('✅ Portal session creada:', portalSession.id);

    return Response.json({
      url: portalSession.url
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return Response.json({ 
      error: error.message || 'Error al crear portal de Stripe' 
    }, { status: 500 });
  }
});