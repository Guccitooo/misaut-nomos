
import { createClient } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClient(req);
    
    // Authenticate user
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
      user_id: user.id
    });

    // ✅ CRÍTICO: Validar que no se puede crear trial si ya fue usado
    if (isTrial === true) {
      console.log('🔍 [TRIAL CHECK] Verificando si usuario ya usó periodo gratuito...');
      
      // Verificar en el usuario si ya usó el trial
      if (user.free_trial_used === true) {
        console.log('🚫 [TRIAL BLOCKED] Usuario ya utilizó periodo gratuito anteriormente');
        return Response.json({ 
          error: 'trial_already_used',
          message: 'Ya has utilizado tu periodo de prueba gratuito. Por favor, selecciona un plan de pago.'
        }, { status: 400 });
      }
      
      console.log('✅ [TRIAL ALLOWED] Usuario puede acceder al periodo gratuito');
    }

    // --- Stripe Customer creation/retrieval ---
    let customer: Stripe.Customer;
    if (user.stripe_customer_id) {
        // Attempt to retrieve existing Stripe Customer
        try {
            const retrievedCustomer = await stripe.customers.retrieve(user.stripe_customer_id);
            if (retrievedCustomer && !retrievedCustomer.deleted) {
                customer = retrievedCustomer;
                console.log(`✅ [STRIPE] Cliente Stripe existente recuperado: ${customer.id}`);
            } else {
                // If customer was deleted or not found, create a new one
                throw new Error("Stripe customer not found or deleted.");
            }
        } catch (retrieveError) {
            console.warn(`⚠️ [STRIPE] Error al recuperar cliente Stripe ${user.stripe_customer_id}: ${retrieveError.message}. Creando uno nuevo.`);
            // Fallback to creating a new customer
            const newCustomer = await stripe.customers.create({
                email: email,
                name: fullName,
                metadata: {
                    base44_user_id: user.id,
                    userType: userType || "professionnel"
                }
            });
            // Update Base44 user with the new Stripe Customer ID
            await base44.asServiceRole.entities.User.update(user.id, { stripe_customer_id: newCustomer.id });
            customer = newCustomer;
            console.log(`✅ [STRIPE] Nuevo cliente Stripe creado y asociado: ${customer.id}`);
        }
    } else {
        // Create new Stripe Customer if no ID exists in Base44 user
        const newCustomer = await stripe.customers.create({
            email: email,
            name: fullName,
            metadata: {
                base44_user_id: user.id,
                userType: userType || "professionnel"
            }
        });
        // Update Base44 user with the new Stripe Customer ID
        await base44.asServiceRole.entities.User.update(user.id, { stripe_customer_id: newCustomer.id });
        customer = newCustomer;
        console.log(`✅ [STRIPE] Nuevo cliente Stripe creado y asociado: ${customer.id}`);
    }
    // --- END Stripe Customer logic ---

    const appOrigin = new URL(req.url).origin;
    
    let successUrl, cancelUrl;
    
    // Updated success/cancel URL logic
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

    // Construct the session configuration
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id, // Use the retrieved/created Stripe customer ID
      line_items: [{
        price: plan.stripe_price_id, // Use Stripe Price ID directly
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { // Session metadata
        user_id: user.id,
        user_email: email,
        plan_id: planId,
        is_trial: isTrial ? 'true' : 'false',
        is_reactivation: isReactivation ? 'true' : 'false'
      },
      subscription_data: { // Subscription metadata
        metadata: {
          user_id: user.id,
          plan_id: planId,
          is_trial: isTrial ? 'true' : 'false'
        }
      }
    };

    if (isTrial) {
      sessionConfig.subscription_data.trial_period_days = 7;
      sessionConfig.payment_method_collection = 'always'; // Mandate payment method for trials
    }

    console.log('📦 [STRIPE] Creando sesión con config:', sessionConfig);

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ [CHECKOUT] Sesión creada exitosamente:', session.id);
    
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
