import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('📋 ========== LIST STRIPE PRICES ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Obtener todos los productos
    const products = await stripe.products.list({ limit: 100 });
    
    console.log(`📦 Productos encontrados: ${products.data.length}`);
    
    const result = [];
    
    for (const product of products.data) {
      const prices = await stripe.prices.list({ product: product.id, limit: 100 });
      
      for (const price of prices.data) {
        const priceInfo = {
          product_name: product.name,
          price_id: price.id,
          unit_amount: price.unit_amount ? price.unit_amount / 100 : 0,
          currency: price.currency,
          interval: price.recurring?.interval || 'one-time',
          active: price.active
        };
        
        result.push(priceInfo);
        console.log(`💰 ${product.name} - ${priceInfo.unit_amount}€/${priceInfo.interval} - ${price.id}`);
      }
    }

    return Response.json({
      ok: true,
      products: products.data.length,
      prices: result
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return Response.json({ 
      error: error.message || 'Error al listar precios' 
    }, { status: 500 });
  }
});