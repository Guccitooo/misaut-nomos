import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeSecretKey) {
  console.error('❌ CRÍTICO: STRIPE_SECRET_KEY no está configurada');
}

const stripe = new Stripe(stripeSecretKey);

Deno.serve(async (req) => {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🛒 CREAR CHECKOUT SESSION - INICIO');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📍 Método:', req.method);
  console.log('📍 URL:', req.url);
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // PASO 1: Validar configuración de Stripe
    console.log('🔍 PASO 1: Validando configuración de Stripe...');
    if (!stripeSecretKey) {
      console.error('❌ CRITICAL: STRIPE_SECRET_KEY no está configurada en las variables de entorno');
      return Response.json({ 
        error: '❌ Configuración de Stripe incompleta. STRIPE_SECRET_KEY no encontrada.',
        detailedError: 'La variable de entorno STRIPE_SECRET_KEY debe estar configurada en Dashboard → Settings → Environment Variables'
      }, { status: 500 });
    }
    console.log('✅ STRIPE_SECRET_KEY presente (longitud:', stripeSecretKey.length, 'caracteres)');
    
    // Validar formato de la clave
    if (!stripeSecretKey.startsWith('sk_')) {
      console.error('❌ CRITICAL: STRIPE_SECRET_KEY tiene formato inválido (debe empezar con sk_)');
      return Response.json({ 
        error: '❌ Clave de Stripe inválida',
        detailedError: 'La clave debe empezar con sk_test_ (modo test) o sk_live_ (modo producción)'
      }, { status: 500 });
    }
    
    const isTestMode = stripeSecretKey.startsWith('sk_test_');
    console.log('🏷️  Modo de Stripe:', isTestMode ? 'TEST' : 'LIVE');

    // PASO 2: Autenticación de usuario
    console.log('\n🔍 PASO 2: Autenticando usuario...');
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('❌ Usuario no autenticado');
      return Response.json({ 
        error: 'No autorizado. Debes iniciar sesión.',
        detailedError: 'El token de autenticación no es válido o ha expirado'
      }, { status: 401 });
    }

    console.log('✅ Usuario autenticado:');
    console.log('   Email:', user.email);
    console.log('   ID:', user.id);
    console.log('   Nombre:', user.full_name || '(sin nombre)');

    // PASO 3: Validar datos recibidos
    console.log('\n🔍 PASO 3: Validando datos del plan...');
    const body = await req.json();
    const { stripePriceId, planName, planPrice, isReactivation = false } = body;

    console.log('📦 Datos recibidos:');
    console.log('   Plan:', planName);
    console.log('   Price ID:', stripePriceId);
    console.log('   Precio:', planPrice, '€');
    console.log('   Reactivación:', isReactivation);

    // Validar Price ID
    if (!stripePriceId) {
      console.error('❌ CRITICAL: stripePriceId no proporcionado');
      return Response.json({ 
        error: '❌ Falta el Price ID del plan',
        detailedError: 'El parámetro stripePriceId es requerido'
      }, { status: 400 });
    }

    if (!stripePriceId.startsWith('price_')) {
      console.error('❌ CRITICAL: Price ID con formato inválido:', stripePriceId);
      return Response.json({ 
        error: '❌ Price ID inválido. Debe empezar con "price_"',
        detailedError: `Recibido: "${stripePriceId}". Los Price IDs de Stripe empiezan con "price_". Verifica que hayas creado los productos en https://dashboard.stripe.com/products`
      }, { status: 400 });
    }
    
    if (stripePriceId.includes('_xxxxx') || stripePriceId.length < 20) {
      console.error('❌ CRITICAL: Price ID parece ser un placeholder:', stripePriceId);
      return Response.json({ 
        error: '❌ Price ID no configurado. Debes crear los productos en Stripe Dashboard primero.',
        detailedError: `Price ID recibido: "${stripePriceId}" - Este no es un Price ID real de Stripe. Crea los productos en https://dashboard.stripe.com/products y actualiza los IDs en el código.`
      }, { status: 400 });
    }
    
    console.log('✅ Price ID validado correctamente');

    // PASO 4: Buscar o crear cliente en Stripe
    console.log('\n🔍 PASO 4: Buscando/creando cliente en Stripe...');
    let stripeCustomerId = null;

    try {
      console.log('   Buscando cliente con email:', user.email);
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        console.log('✅ Cliente existente encontrado:');
        console.log('   Customer ID:', stripeCustomerId);
        console.log('   Nombre:', customers.data[0].name || '(sin nombre)');
      } else {
        console.log('➕ Cliente no existe, creando nuevo...');
        
        const customerData = {
          email: user.email,
          name: user.full_name || user.email.split('@')[0],
          metadata: {
            user_id: user.id,
            platform: 'misautonomos',
            created_at: new Date().toISOString()
          }
        };
        
        console.log('   Datos del cliente:', JSON.stringify(customerData, null, 2));
        
        const newCustomer = await stripe.customers.create(customerData);
        
        stripeCustomerId = newCustomer.id;
        console.log('✅ Cliente creado exitosamente:');
        console.log('   Customer ID:', stripeCustomerId);
      }
    } catch (stripeError) {
      console.error('\n❌ ERROR EN STRIPE API (Clientes):');
      console.error('   Mensaje:', stripeError.message);
      console.error('   Código:', stripeError.code);
      console.error('   Tipo:', stripeError.type);
      console.error('   HTTP Status:', stripeError.statusCode);
      
      if (stripeError.code === 'invalid_request_error') {
        return Response.json({ 
          error: '❌ Error de configuración de Stripe',
          detailedError: `${stripeError.message}. Verifica que la API Key sea correcta.`
        }, { status: 500 });
      }
      
      return Response.json({ 
        error: '❌ Error conectando con Stripe',
        detailedError: stripeError.message
      }, { status: 500 });
    }

    // PASO 5: Configurar URLs y parámetros de sesión
    console.log('\n🔍 PASO 5: Configurando sesión de checkout...');
    
    const baseUrl = req.headers.get('origin') || 'https://misautonomos.es';
    const successUrl = `${baseUrl}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/PricingPlans?canceled=true`;

    console.log('📍 URLs de redirección:');
    console.log('   Base URL:', baseUrl);
    console.log('   Success URL:', successUrl);
    console.log('   Cancel URL:', cancelUrl);
    
    console.log('\n⚙️ Configuración de la sesión:');
    console.log('   Modo: subscription');
    console.log('   Customer ID:', stripeCustomerId);
    console.log('   Price ID:', stripePriceId);
    console.log('   Trial: 7 días');
    console.log('   Payment methods: card');

    const sessionParams = {
      mode: 'subscription',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
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
        platform: 'misautonomos',
        created_at: new Date().toISOString()
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
    
    console.log('\n📋 Parámetros completos de la sesión:');
    console.log(JSON.stringify(sessionParams, null, 2));

    // PASO 6: Crear sesión de checkout en Stripe
    console.log('\n🔍 PASO 6: Creando sesión de checkout en Stripe...');
    console.log('   Invocando stripe.checkout.sessions.create()...');
    
    let session;
    try {
      const createStartTime = Date.now();
      session = await stripe.checkout.sessions.create(sessionParams);
      const createElapsed = Date.now() - createStartTime;
      
      console.log(`✅ Sesión creada exitosamente en ${createElapsed}ms`);
      console.log('\n📊 Detalles de la sesión:');
      console.log('   Session ID:', session.id);
      console.log('   Customer ID:', session.customer);
      console.log('   Mode:', session.mode);
      console.log('   Payment status:', session.payment_status);
      console.log('   URL:', session.url);
      console.log('   Expires at:', new Date(session.expires_at * 1000).toISOString());
      
    } catch (stripeCheckoutError) {
      console.error('\n❌ ERROR AL CREAR SESIÓN DE CHECKOUT:');
      console.error('   Mensaje:', stripeCheckoutError.message);
      console.error('   Código:', stripeCheckoutError.code);
      console.error('   Tipo:', stripeCheckoutError.type);
      console.error('   HTTP Status:', stripeCheckoutError.statusCode);
      console.error('   Request ID:', stripeCheckoutError.requestId);
      
      // Análisis específico de errores
      if (stripeCheckoutError.message.includes('No such price') || stripeCheckoutError.code === 'resource_missing') {
        console.error('\n💡 DIAGNÓSTICO: El Price ID no existe en tu cuenta de Stripe');
        console.error('   Price ID buscado:', stripePriceId);
        console.error('   Modo de Stripe:', isTestMode ? 'TEST' : 'LIVE');
        console.error('\n📝 SOLUCIÓN:');
        console.error('   1. Ve a https://dashboard.stripe.com/products');
        console.error('   2. Crea dos productos:');
        console.error('      - Plan Profesional: 30€/mes recurrente');
        console.error('      - Plan Growth: 50€/mes recurrente');
        console.error('   3. Copia los Price IDs (empiezan con "price_")');
        console.error('   4. Actualiza el archivo pages/PricingPlans.js líneas 26 y 39');
        
        return Response.json({ 
          error: `❌ El Price ID "${stripePriceId}" no existe en tu cuenta de Stripe ${isTestMode ? 'TEST' : 'LIVE'}`,
          detailedError: `${stripeCheckoutError.message}\n\nCrea los productos en https://dashboard.stripe.com/products y actualiza los Price IDs en el código.`
        }, { status: 400 });
      }
      
      if (stripeCheckoutError.message.includes('Invalid API Key') || stripeCheckoutError.type === 'invalid_request_error') {
        console.error('\n💡 DIAGNÓSTICO: Problema con la API Key de Stripe');
        return Response.json({ 
          error: '❌ API Key de Stripe inválida o expirada',
          detailedError: stripeCheckoutError.message
        }, { status: 500 });
      }
      
      if (stripeCheckoutError.code === 'parameter_invalid_empty') {
        console.error('\n💡 DIAGNÓSTICO: Parámetros inválidos en la solicitud');
        return Response.json({ 
          error: '❌ Configuración incorrecta de la sesión',
          detailedError: stripeCheckoutError.message
        }, { status: 400 });
      }
      
      // Error genérico
      console.error('\n💡 DIAGNÓSTICO: Error desconocido de Stripe');
      return Response.json({ 
        error: `❌ Error de Stripe: ${stripeCheckoutError.message}`,
        detailedError: stripeCheckoutError.message
      }, { status: 400 });
    }

    // Validar que la URL fue generada
    if (!session.url) {
      console.error('\n❌ CRITICAL: Stripe no devolvió URL de checkout');
      console.error('   Session ID:', session.id);
      console.error('   Status:', session.status);
      return Response.json({ 
        error: '❌ Error interno: Stripe no generó URL de pago',
        detailedError: 'La sesión fue creada pero sin URL de redirección'
      }, { status: 500 });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ CHECKOUT SESSION CREADA EXITOSAMENTE');
    console.log('   Siguiente paso: Redirigir al cliente a:', session.url);
    console.log('═══════════════════════════════════════════════════════\n');

    return Response.json({
      ok: true,
      sessionId: session.id,
      url: session.url,
      customerId: stripeCustomerId
    });

  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('❌ ERROR GENERAL NO CONTROLADO');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════════════════════\n');
    
    return Response.json({ 
      error: error.message || 'Error interno al procesar la solicitud',
      detailedError: error.stack
    }, { status: 500 });
  }
});