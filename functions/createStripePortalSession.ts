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

    if (subs.length === 0) {
      return Response.json({ 
        error: 'No tienes suscripción activa' 
      }, { status: 404 });
    }

    const subscription = subs[0];
    let customerId = subscription.stripe_customer_id;

    // 🔥 Si no hay customer_id en BD, buscar en Stripe por email
    if (!customerId) {
      console.log('🔍 No hay customer_id, buscando en Stripe...');
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('✅ Customer encontrado en Stripe:', customerId);
        
        // Actualizar BD con el customer_id
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          stripe_customer_id: customerId
        });
      } else {
        return Response.json({ 
          error: 'No se encontró tu cuenta en Stripe. Contacta con soporte.' 
        }, { status: 404 });
      }
    }

    console.log('✅ Customer ID:', customerId);

    // 🔥 VERIFICAR QUE EL CUSTOMER EXISTE EN STRIPE
    try {
      await stripe.customers.retrieve(customerId);
    } catch (stripeError) {
      console.error('❌ Customer no existe en Stripe:', stripeError.message);
      
      // Intentar buscar por email como fallback
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('✅ Customer encontrado por email:', customerId);
        
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
          stripe_customer_id: customerId
        });
      } else {
        return Response.json({ 
          error: 'Tu cuenta de Stripe no está disponible. Contacta con soporte.' 
        }, { status: 404 });
      }
    }

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