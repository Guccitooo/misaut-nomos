import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeSecretKey) {
  console.error('❌ CRÍTICO: STRIPE_SECRET_KEY no está configurada');
}

const stripe = new Stripe(stripeSecretKey);

Deno.serve(async (req) => {
  console.log('\n🛒 ========== CREAR CHECKOUT SESSION ==========');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY no configurada');
      return Response.json({ 
        error: 'Configuración de Stripe incompleta. STRIPE_SECRET_KEY no encontrada.' 
      }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('❌ Usuario no autenticado');
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('👤 Usuario autenticado:', user.email, '(ID:', user.id, ')');

    const body = await req.json();
    const { stripePriceId, planName, planPrice, isReactivation = false } = body;

    console.log('📦 Datos recibidos:');
    console.log('  - Plan:', planName);
    console.log('  - Price ID:', stripePriceId);
    console.log('  - Precio:', planPrice, '€');
    console.log('  - Reactivación:', isReactivation);

    if (!stripePriceId || stripePriceId.includes('_xxxxx')) {
      console.error('❌ Price ID no configurado correctamente:', stripePriceId);
      return Response.json({ 
        error: '⚠️ Price ID no válido. Debes crear los productos en Stripe Dashboard y actualizar los Price IDs en el código.',
        detailedError: `Price ID recibido: "${stripePriceId}"`
      }, { status: 400 });
    }

    console.log('\n🔍 Buscando/creando cliente en Stripe...');
    let stripeCustomerId = null;

    try {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        console.log('✅ Cliente existente:', stripeCustomerId);
      } else {
        console.log('➕ Creando nuevo cliente...');
        
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: user.full_name || user.email.split('@')[0],
          metadata: {
            user_id: user.id,
            platform: 'misautonomos'
          }
        });
        
        stripeCustomerId = newCustomer.id;
        console.log('✅ Cliente creado:', stripeCustomerId);
      }
    } catch (stripeError) {
      console.error('❌ Error en Stripe API:', stripeError.message);
      console.error('   Código:', stripeError.code);
      console.error('   Tipo:', stripeError.type);
      
      return Response.json({ 
        error: 'Error conectando con Stripe. Verifica las API keys.',
        detailedError: stripeError.message
      }, { status: 500 });
    }

    const baseUrl = req.headers.get('origin') || 'https://misautonomos.es';
    const successUrl = `${baseUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/PricingPlans?canceled=true`;

    console.log('\n📍 URLs configuradas:');
    console.log('  - Success:', successUrl);
    console.log('  - Cancel:', cancelUrl);
    console.log('🎁 Trial: 7 días gratis');

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

    console.log('\n🔨 Creando sesión de checkout...');
    console.log('   Price ID:', stripePriceId);
    
    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
      console.log('✅ Sesión creada exitosamente');
      console.log('   Session ID:', session.id);
      console.log('   URL:', session.url);
    } catch (stripeCheckoutError) {
      console.error('\n❌ ERROR DE STRIPE CHECKOUT:');
      console.error('   Mensaje:', stripeCheckoutError.message);
      console.error('   Código:', stripeCheckoutError.code);
      console.error('   Tipo:', stripeCheckoutError.type);
      
      if (stripeCheckoutError.message.includes('No such price')) {
        return Response.json({ 
          error: `❌ Price ID no existe en Stripe: "${stripePriceId}". Crea los productos primero en https://dashboard.stripe.com/products`,
          detailedError: stripeCheckoutError.message
        }, { status: 400 });
      }
      
      if (stripeCheckoutError.message.includes('Invalid API Key')) {
        return Response.json({ 
          error: '❌ API Key de Stripe inválida. Verifica STRIPE_SECRET_KEY.',
          detailedError: stripeCheckoutError.message
        }, { status: 500 });
      }
      
      return Response.json({ 
        error: `Error de Stripe: ${stripeCheckoutError.message}`,
        detailedError: stripeCheckoutError.message
      }, { status: 400 });
    }

    console.log('\n✅ ========== CHECKOUT EXITOSO ==========\n');

    return Response.json({
      ok: true,
      sessionId: session.id,
      url: session.url,
      customerId: stripeCustomerId
    });

  } catch (error) {
    console.error('\n❌ ========== ERROR GENERAL ==========');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('=======================================\n');
    
    return Response.json({ 
      error: error.message || 'Error interno al procesar la solicitud',
      detailedError: error.stack
    }, { status: 500 });
  }
});