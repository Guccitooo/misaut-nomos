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
    const { planId, planPrice, isReactivation = false } = body;

    console.log('📦 Plan solicitado:', planId, '- Precio:', planPrice, '- Reactivación:', isReactivation);

    // ✅ VERIFICAR SI YA USÓ TRIAL
    if (user.has_used_trial === true && !isReactivation) {
      console.log('⚠️ Usuario ya usó prueba gratuita');
    }

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

    // ✅ OBTENER PLAN
    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: planId });
    const plan = plans[0];

    if (!plan) {
      console.error('❌ Plan no encontrado:', planId);
      return Response.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    console.log('💼 Plan encontrado:', plan.nombre, '- Precio:', plan.precio);

    // ✅ CONFIGURAR URLs - SIEMPRE ir a PaymentSuccess para verificar pago
    const baseUrl = req.headers.get('origin') || 'https://misautonomos.es';
    
    const successUrl = `${baseUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/PricingPlans?canceled=true`;

    // ✅ CONFIGURAR INTERVALO DE FACTURACIÓN - SIEMPRE MENSUAL
    const interval = 'month';
    const intervalCount = 1;
    
    console.log('📅 Intervalo configurado:', interval, 'x', intervalCount);

    // ✅ DETERMINAR SI OFRECER TRIAL
    const offerTrial = !user.has_used_trial && !isReactivation;
    const trialDays = offerTrial ? 7 : 0;

    console.log('🎁 Ofrecer trial:', offerTrial, '- Días:', trialDays);

    // ✅ CREAR SESIÓN DE CHECKOUT
    const sessionParams = {
      mode: 'subscription',
      customer: stripeCustomerId, // ✅ SIEMPRE usar customer ID
      allow_promotion_codes: false,
      billing_address_collection: 'required',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_id: planId,
        is_reactivation: isReactivation.toString(),
        trial_offered: offerTrial.toString()
      },
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: offerTrial ? `${plan.nombre} - 7 días gratis` : plan.nombre,
            description: plan.descripcion || `Suscripción ${plan.nombre} MisAutónomos`,
          },
          unit_amount: Math.round(plan.precio * 100), // ✅ Usar precio del plan
          recurring: {
            interval: interval,
            interval_count: intervalCount
          }
        },
        quantity: 1
      }],
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email,
          plan_id: planId,
          platform: 'misautonomos'
        }
      },
      payment_method_collection: 'always'
    };

    // ✅ AÑADIR TRIAL SI CORRESPONDE
    if (offerTrial) {
      sessionParams.subscription_data.trial_period_days = trialDays;
    }

    console.log('📋 Creando sesión de checkout...');
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('✅ Sesión creada:', session.id);
    console.log('🔗 URL:', session.url);

    return Response.json({
      sessionId: session.id,
      url: session.url,
      customerId: stripeCustomerId
    });

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('❌ Stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Error al crear la sesión de pago' 
    }, { status: 500 });
  }
});