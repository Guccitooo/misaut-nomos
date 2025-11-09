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
      cifNif,
      phone,
      activity,
      activityOther,
      address,
      paymentMethod,
      planId,
      planPrice,
      isTrial,
      isReactivation
    } = body;

    console.log('💳 [CHECKOUT] Datos recibidos:', {
      email,
      userType,
      planId,
      isTrial,
      isReactivation,
      user_id: user.id,
      free_trial_used: user.free_trial_used
    });

    // ✅ CRÍTICO: Validar que no se puede crear trial si ya fue usado
    if (isTrial === true) {
      console.log('🔍 [TRIAL CHECK] Verificando si usuario ya usó periodo gratuito...');
      console.log('📊 [TRIAL CHECK] user.free_trial_used =', user.free_trial_used);
      
      // Verificar en el usuario si ya usó el trial
      if (user.free_trial_used === true) {
        console.log('🚫 [TRIAL BLOCKED] Usuario ya utilizó periodo gratuito anteriormente');
        return Response.json({ 
          error: 'trial_already_used',
          message: 'Ya has utilizado tu periodo de prueba gratuito. Por favor, selecciona un plan de pago.'
        }, { status: 400 });
      }
      
      console.log('✅ [TRIAL ALLOWED] Usuario puede acceder al periodo gratuito');
      
      // ✅ NUEVO: Marcar como usado ANTES de crear la sesión (prevención extra)
      console.log('🎁 [TRIAL] Pre-marcando free_trial_used = true ANTES de crear checkout...');
      try {
        await base44.asServiceRole.entities.User.update(user.id, {
          free_trial_used: true
        });
        console.log('✅ [TRIAL] free_trial_used marcado como true ANTES de checkout');
        
        // Verificar
        const verifyUser = await base44.asServiceRole.entities.User.filter({ id: user.id });
        console.log('🔍 [TRIAL VERIFY] free_trial_used en BD:', verifyUser[0]?.free_trial_used);
      } catch (error) {
        console.error('❌ [TRIAL] Error CRÍTICO pre-marcando trial:', error);
        return Response.json({ 
          error: 'Error al procesar periodo gratuito',
          details: error.message
        }, { status: 500 });
      }
    }

    let customer;
    if (user.stripe_customer_id) {
        try {
            const retrievedCustomer = await stripe.customers.retrieve(user.stripe_customer_id);
            if (retrievedCustomer && !retrievedCustomer.deleted) {
                customer = retrievedCustomer;
                console.log(`✅ [STRIPE] Cliente Stripe existente recuperado: ${customer.id}`);
            } else {
                throw new Error("Stripe customer not found or deleted.");
            }
        } catch (retrieveError) {
            console.warn(`⚠️ [STRIPE] Error al recuperar cliente Stripe ${user.stripe_customer_id}: ${retrieveError.message}. Creando uno nuevo.`);
            const newCustomer = await stripe.customers.create({
                email: email,
                name: fullName,
                metadata: {
                    base44_user_id: user.id,
                    userType: userType || "professionnel",
                    free_trial_used: isTrial ? 'true' : 'false'
                }
            });
            await base44.asServiceRole.entities.User.update(user.id, { stripe_customer_id: newCustomer.id });
            customer = newCustomer;
            console.log(`✅ [STRIPE] Nuevo cliente Stripe creado y asociado: ${customer.id}`);
        }
    } else {
        const newCustomer = await stripe.customers.create({
            email: email,
            name: fullName,
            metadata: {
                base44_user_id: user.id,
                userType: userType || "professionnel",
                free_trial_used: isTrial ? 'true' : 'false'
            }
        });
        await base44.asServiceRole.entities.User.update(user.id, { stripe_customer_id: newCustomer.id });
        customer = newCustomer;
        console.log(`✅ [STRIPE] Nuevo cliente Stripe creado y asociado: ${customer.id}`);
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
        is_reactivation: isReactivation ? 'true' : 'false',
        free_trial_marked: isTrial ? 'true' : 'false' // ✅ NUEVO: Flag adicional
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          email: email,
          plan_id: planId,
          is_trial: isTrial ? 'true' : 'false',
          free_trial_marked: isTrial ? 'true' : 'false'
        }
      }
    };

    if (isTrial) {
      sessionConfig.subscription_data.trial_period_days = 7;
      sessionConfig.payment_method_collection = 'always';
      
      // ✅ NUEVO: Configurar para que NO se puedan crear trials duplicados en Stripe
      sessionConfig.subscription_data.trial_settings = {
        end_behavior: {
          missing_payment_method: 'cancel' // Cancelar si no hay método de pago al final
        }
      };
    }

    console.log('📦 [STRIPE] Creando sesión con config:', sessionConfig);

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ [CHECKOUT] Sesión creada exitosamente:', session.id);
    console.log('🔍 [CHECKOUT] free_trial_used marcado:', isTrial);
    
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