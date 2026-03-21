import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  timeout: 8000,
  maxNetworkRetries: 2
});

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

    console.log('📋 Suscripción encontrada:', {
      id: subscription.id,
      estado: subscription.estado,
      customer_id: customerId ? customerId.substring(0, 10) + '...' : 'NULL'
    });

    // 🔥 Si no hay customer_id en BD, buscar en Stripe por email
    if (!customerId) {
      console.log('🔍 No hay customer_id en BD, buscando por email:', user.email);
      
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1
        });
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log('✅ Customer encontrado:', customerId);
          
          // Actualizar BD
          await base44.asServiceRole.entities.Subscription.update(subscription.id, {
            stripe_customer_id: customerId
          });
        } else {
          console.error('❌ No hay customer en Stripe para:', user.email);
          return Response.json({ 
            error: 'Tu cuenta de Stripe no está configurada. Contacta con soporte.' 
          }, { status: 404 });
        }
      } catch (searchError) {
        console.error('❌ Error buscando customer:', searchError.message);
        return Response.json({ 
          error: 'Error al buscar tu cuenta de Stripe' 
        }, { status: 500 });
      }
    }

    console.log('✅ Customer ID confirmado:', customerId);

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
    const returnUrl = `${baseUrl}/SubscriptionManagement?from=stripe_portal`;

    console.log('🔗 Creando portal session para:', customerId);
    console.log('🔙 Return URL:', returnUrl);

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      console.log('✅ Portal session creada:', portalSession.id);
      console.log('🌐 URL del portal:', portalSession.url.substring(0, 50) + '...');

      return Response.json({
        url: portalSession.url,
        customer_id: customerId
      });
    } catch (portalError) {
      console.error('❌ Error creando portal session:', portalError.message);
      return Response.json({ 
        error: 'Error al generar el portal de Stripe: ' + portalError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return Response.json({ 
      error: error.message || 'Error al crear portal de Stripe' 
    }, { status: 500 });
  }
});