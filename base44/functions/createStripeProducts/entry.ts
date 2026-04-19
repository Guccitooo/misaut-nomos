import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('🛠️ ========== CREATE STRIPE PRODUCTS ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Crear producto Plan Visibilidad
    console.log('📦 Creando Plan Visibilidad...');
    const visibilityProduct = await stripe.products.create({
      name: 'Plan Visibilidad',
      description: 'Perfil visible en búsquedas de MisAutónomos',
      metadata: { plan_id: 'plan_visibility' }
    });

    const visibilityPrice = await stripe.prices.create({
      product: visibilityProduct.id,
      unit_amount: 1300, // 13.00 EUR
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { plan_id: 'plan_visibility' }
    });

    console.log(`✅ Plan Visibilidad: ${visibilityProduct.id} - Price: ${visibilityPrice.id}`);

    // Crear producto Plan Ads+
    console.log('📦 Creando Plan Ads+...');
    const adsplusProduct = await stripe.products.create({
      name: 'Plan Ads+',
      description: 'Plan completo con campañas publicitarias',
      metadata: { plan_id: 'plan_adsplus' }
    });

    const adsplusPrice = await stripe.prices.create({
      product: adsplusProduct.id,
      unit_amount: 3300, // 33.00 EUR
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { plan_id: 'plan_adsplus' }
    });

    console.log(`✅ Plan Ads+: ${adsplusProduct.id} - Price: ${adsplusPrice.id}`);

    // Actualizar en BD
    await base44.asServiceRole.entities.SubscriptionPlan.update(
      (await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: 'plan_visibility' }))[0].id,
      { stripe_price_id: visibilityPrice.id, precio: 13 }
    );

    await base44.asServiceRole.entities.SubscriptionPlan.update(
      (await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: 'plan_adsplus' }))[0].id,
      { stripe_price_id: adsplusPrice.id, precio: 33 }
    );

    console.log('✅ BD actualizada');

    return Response.json({
      ok: true,
      message: 'Productos y precios creados correctamente',
      visibility: {
        product_id: visibilityProduct.id,
        price_id: visibilityPrice.id
      },
      adsplus: {
        product_id: adsplusProduct.id,
        price_id: adsplusPrice.id
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return Response.json({ 
      error: error.message || 'Error al crear productos' 
    }, { status: 500 });
  }
});