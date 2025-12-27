import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('🛒 ========== CREAR CHECKOUT SESSION ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 Usuario:', user.email, '- ID:', user.id);

    const body = await req.json();
    const { stripePriceId, planName, planPrice, isReactivation = false } = body;

    console.log('📦 Plan solicitado:', planName, '- Precio ID:', stripePriceId, '- Reactivación:', isReactivation);

    // ✅ BUSCAR/CREAR CLIENTE EN STRIPE
    let stripeCustomerId = null;

    try {
      // Buscar cliente existente en Stripe
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        console.log('✅ Cliente Stripe encontrado:', stripeCustomerId);
      } else {
        // ✅ CREAR NUEVO CLIENTE EN STRIPE
        console.log('➕ Creando nuevo cliente en Stripe...');
        
        const customerData = {
          email: user.email,
          name: user.full_name || user.email.split('@')[0],
          metadata: {
            user_id: user.id,
            platform: 'misautonomos',
            created_from: 'checkout_session'
          }
        };

        const newCustomer = await stripe.customers.create(customerData);
        stripeCustomerId = newCustomer.id;
        console.log('✅ Cliente Stripe creado:', stripeCustomerId);
      }
    } catch (stripeError) {
      console.error('❌ Error con Stripe:', stripeError.message);
      return Response.json({ 
        error: 'Error conectando con el sistema de pagos. Inténtalo de nuevo.' 
      }, { status: 500 });
    }

    console.log('💼 Plan:', planName, '- Precio:', planPrice, '€');

    const baseUrl = req.headers.get('origin') || 'https://misautonomos.es';
    const successUrl = `${baseUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/PricingPlans?canceled=true`;

    console.log('🎁 Aplicando trial de 7 días para todos los planes');

    const sessionParams = {
      mode: 'subscription',
      customer: stripeCustomerId,
      allow_promotion_codes: false,
      billing_address_collection: 'required',
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_collection: 'always',
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_name: planName,
        plan_price: planPrice.toString(),
        platform: 'misautonomos'
      },
      line_items: [{
        price: stripePriceId,
        quantity: 1
      }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          plan_name: planName,
          plan_price: planPrice.toString(),
          platform: 'misautonomos'
        }
      }
    };

    console.log('📋 Creando sesión de checkout con Price ID:', stripePriceId);
    
    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (stripeCheckoutError) {
      console.error('❌ Error de Stripe Checkout:', stripeCheckoutError.message);
      
      if (stripeCheckoutError.message.includes('No such price')) {
        return Response.json({ 
          error: `⚠️ Price ID inválido: "${stripePriceId}". Debes crear los productos en Stripe Dashboard y actualizar los Price IDs en el código.`,
          detailedError: stripeCheckoutError.message
        }, { status: 400 });
      }
      
      return Response.json({ 
        error: `Error de Stripe: ${stripeCheckoutError.message}`,
        detailedError: stripeCheckoutError.message
      }, { status: 400 });
    }

    console.log('✅ Sesión creada:', session.id);
    console.log('🔗 URL:', session.url);

    return Response.json({
      ok: true,
      sessionId: session.id,
      url: session.url,
      customerId: stripeCustomerId
    });

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('❌ Stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Error al crear la sesión de pago',
      detailedError: error.stack
    }, { status: 500 });
  }
});