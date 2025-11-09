import Stripe from 'npm:stripe@17.5.0';
import { createClient } from 'npm:@base44/sdk@0.7.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClient(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      email,
      fullName,
      userType,
      planId,
      isTrial,
      isReactivation
    } = body;

    console.log('💳 [CHECKOUT] Datos recibidos:', {
      email,
      planId,
      isTrial,
      user_id: user.id,
      free_trial_used: user.free_trial_used
    });

    // ✅ VALIDACIÓN: Bloquear trial si ya fue usado
    if (isTrial === true && user.free_trial_used === true) {
      console.log('🚫 [TRIAL BLOCKED] Usuario ya utilizó periodo gratuito');
      return Response.json({ 
        error: 'trial_already_used',
        message: 'Ya has utilizado tu periodo de prueba gratuito. Por favor, selecciona un plan de pago.'
      }, { status: 400 });
    }

    // Crear/recuperar cliente Stripe
    let customer;
    if (user.stripe_customer_id) {
      try {
        const retrievedCustomer = await stripe.customers.retrieve(user.stripe_customer_id);
        if (retrievedCustomer && !retrievedCustomer.deleted) {
          customer = retrievedCustomer;
          console.log(`✅ Cliente Stripe existente: ${customer.id}`);
        } else {
          throw new Error("Stripe customer deleted");
        }
      } catch (retrieveError) {
        const newCustomer = await stripe.customers.create({
          email: email,
          name: fullName,
          metadata: {
            base44_user_id: user.id,
            userType: userType || "professionnel"
          }
        });
        await base44.asServiceRole.entities.User.update(user.id, { 
          stripe_customer_id: newCustomer.id 
        });
        customer = newCustomer;
        console.log(`✅ Nuevo cliente Stripe: ${customer.id}`);
      }
    } else {
      const newCustomer = await stripe.customers.create({
        email: email,
        name: fullName,
        metadata: {
          base44_user_id: user.id,
          userType: userType || "professionnel"
        }
      });
      await base44.asServiceRole.entities.User.update(user.id, { 
        stripe_customer_id: newCustomer.id 
      });
      customer = newCustomer;
      console.log(`✅ Nuevo cliente Stripe: ${customer.id}`);
    }

    const appOrigin = new URL(req.url).origin;
    
    let successUrl, cancelUrl;
    
    if (isTrial) {
      successUrl = `${appOrigin}${isReactivation ? '/my-profile' : '/profile-onboarding'}?onboarding=pending`;
      cancelUrl = `${appOrigin}/pricing-plans?canceled=true`;
    } else if (isReactivation) {
      successUrl = `${appOrigin}/my-profile?reactivation=success`;
      cancelUrl = `${appOrigin}/my-profile?reactivation=canceled`;
    } else {
      successUrl = `${appOrigin}/profile-onboarding?onboarding=pending`;
      cancelUrl = `${appOrigin}/pricing-plans?canceled=true`;
    }

    const planDetails = await base44.entities.SubscriptionPlan.filter({ plan_id: planId });
    const plan = planDetails[0];

    if (!plan || !plan.stripe_price_id) {
      return Response.json({ 
        error: 'Plan no encontrado o sin precio configurado en Stripe' 
      }, { status: 400 });
    }

    const sessionConfig = {
      customer: customer.id,
      line_items: [{
        price: plan.stripe_price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        user_email: email,
        plan_id: planId,
        is_trial: isTrial ? 'true' : 'false',
        is_reactivation: isReactivation ? 'true' : 'false'
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          email: email,
          plan_id: planId,
          is_trial: isTrial ? 'true' : 'false'
        }
      }
    };

    // ✅ SOLO configurar trial en Stripe, NO marcar en BD aún
    if (isTrial) {
      sessionConfig.subscription_data.trial_period_days = 7;
      sessionConfig.payment_method_collection = 'always';
    }

    console.log('📦 [STRIPE] Creando sesión...');
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ [CHECKOUT] Sesión creada:', session.id);
    
    return Response.json({ 
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('❌ [CHECKOUT ERROR]:', error);
    return Response.json({ 
      error: error.message || 'Error al crear sesión de pago' 
    }, { status: 500 });
  }
});