import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('🔧 ========== FIX PRICE IDS ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Obtener todos los productos y precios de Stripe
    const products = await stripe.products.list({ limit: 100 });
    
    console.log(`📦 Encontrados ${products.data.length} productos en Stripe`);
    
    const priceMap = {};
    
    for (const product of products.data) {
      const prices = await stripe.prices.list({ product: product.id, limit: 100 });
      
      for (const price of prices.data) {
        const planName = product.name.toLowerCase();
        const priceValue = price.unit_amount ? price.unit_amount / 100 : 0;
        
        console.log(`💰 ${product.name} (${planName}) - ${priceValue}€/mes - ${price.id}`);
        
        // Mapear plan_visibility y plan_adsplus
        if (planName.includes('visibility') || planName.includes('visibilidad')) {
          priceMap['plan_visibility'] = { price_id: price.id, product_id: product.id, precio: priceValue };
        }
        if (planName.includes('adsplus') || planName.includes('ads+')) {
          priceMap['plan_adsplus'] = { price_id: price.id, product_id: product.id, precio: priceValue };
        }
      }
    }

    console.log('✅ Mapa de precios:', priceMap);

    // Actualizar en BD
    const updates = [];
    
    for (const [planId, priceData] of Object.entries(priceMap)) {
      const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
        plan_id: planId
      });
      
      if (plans.length > 0) {
        const plan = plans[0];
        await base44.asServiceRole.entities.SubscriptionPlan.update(plan.id, {
          stripe_price_id: priceData.price_id,
          precio: priceData.precio
        });
        updates.push(`✅ ${planId}: ${priceData.price_id}`);
        console.log(`✅ Actualizado ${planId}: ${priceData.price_id}`);
      } else {
        console.log(`⚠️  Plan ${planId} no encontrado en BD`);
      }
    }

    return Response.json({
      ok: true,
      message: 'Price IDs actualizados correctamente',
      updates
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return Response.json({ 
      error: error.message || 'Error al actualizar Price IDs' 
    }, { status: 500 });
  }
});