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

    console.log(`👤 Usuario: ${user.email}, has_used_trial: ${user.has_used_trial}, first_trial_date: ${user.first_trial_date}`);
    
    if (user.has_used_trial === true && !isReactivation) {
      console.log('⚠️ Usuario ya usó trial - NO SE PUEDE OFRECER GRATIS DE NUEVO');
      return Response.json({ 
        error: 'Ya has usado tu periodo de prueba gratuito de 2 meses anteriormente. Contacta con soporte si crees que es un error.' 
      }, { status: 400 });
    }

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
      customer_email: user.email,
      mode: 'subscription',
      allow_promotion_codes: false,
      billing_address_collection: 'required',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        email: user.email,
        fullName: user.full_name || email.split('@')[0],
        phone: user.phone || '',
        address: user.city || '',
        planId: planId,
        plan_id: planId,
        is_reactivation: isReactivation.toString(),
        trial_offered: user.has_used_trial === true ? 'false' : 'true'
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
        trial_period_days: user.has_used_trial === true ? 0 : 60,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          plan_id: planId,
          email: user.email,
          fullName: user.full_name || email.split('@')[0],
          phone: user.phone || '',
          address: user.city || '',
          discount: planId === 'plan_monthly_trial' ? '0' : planId === 'plan_quarterly' ? '10' : '20',
          trial: user.has_used_trial === true ? 'no_trial' : '2_meses_gratis'
        }
      },
      payment_method_collection: 'always'
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