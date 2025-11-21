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

    const body = await req.json();
    const { planId, planPrice, isReactivation = false } = body;

    if (user.has_used_trial === true) {
      return Response.json({ 
        error: 'Ya has usado tu periodo de prueba gratuito de 2 meses. Ahora el pago se aplicará inmediatamente.' 
      }, { status: 400 });
    }

    // ✅ VERIFICAR SUSCRIPCIONES EXISTENTES EN BASE DE DATOS
    const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
      user_id: user.id 
    });
    
    if (!isReactivation && existingSubscriptions.length > 0) {
      const activeSub = existingSubscriptions.find(sub => 
        sub.estado === 'activo' || sub.estado === 'en_prueba'
      );
      if (activeSub) {
        return Response.json({ 
          error: 'Ya tienes una suscripción activa' 
        }, { status: 400 });
      }
    }

    // ✅ VERIFICAR SUSCRIPCIONES ACTIVAS EN STRIPE
    let stripeCustomerId = null;
    try {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        console.log(`✅ Cliente de Stripe encontrado: ${stripeCustomerId}`);
        
        // Buscar suscripciones activas en Stripe
        const activeStripeSubscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'active',
          limit: 10
        });

        if (activeStripeSubscriptions.data.length > 0) {
          console.log(`⚠️ Se encontraron ${activeStripeSubscriptions.data.length} suscripciones activas en Stripe`);
          return Response.json({ 
            error: 'Ya tienes una suscripción activa en Stripe. Por favor contacta con soporte.' 
          }, { status: 400 });
        }
      }
    } catch (stripeError) {
      console.error('⚠️ Error verificando Stripe (continuando):', stripeError);
    }

    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: planId });
    const plan = plans[0];

    if (!plan) {
      return Response.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const baseUrl = req.headers.get('origin') || 'https://misautonomos.es';
    const successUrl = isReactivation 
      ? `${baseUrl}/MyProfile?reactivation=success`
      : `${baseUrl}/MyProfile?onboarding=pending`;
    const cancelUrl = `${baseUrl}/PricingPlans?canceled=true`;

    const interval = plan.duracion_dias === 30 ? 'month' : plan.duracion_dias === 90 ? 'month' : 'year';
    const intervalCount = plan.duracion_dias === 30 ? 1 : plan.duracion_dias === 90 ? 3 : 1;

    let sessionParams = {
      mode: 'subscription',
      allow_promotion_codes: false,
      billing_address_collection: 'required',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_id: planId,
        is_reactivation: isReactivation.toString(),
        trial_offered: 'true'
      },
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${plan.nombre} - 2 meses gratis`,
            description: plan.descripcion || `Suscripción ${plan.nombre}`,
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
          user_email: user.email,
          plan_id: planId,
          discount: planId === 'plan_monthly_trial' ? '0' : planId === 'plan_quarterly' ? '10' : '20',
          trial: '2 meses'
        }
      },
      payment_method_collection: 'always'
    };

    // ✅ Si existe el cliente en Stripe, usarlo en lugar de customer_email
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
      console.log(`✅ Usando cliente existente: ${stripeCustomerId}`);
    } else {
      sessionParams.customer_email = user.email;
      console.log(`✅ Creando nuevo cliente con email: ${user.email}`);
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    return Response.json({ 
      error: error.message || 'Error al crear la sesión de pago' 
    }, { status: 500 });
  }
});