import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('⬆️ ========== UPGRADE SUBSCRIPTION ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { newPlanId } = body;

    console.log('👤 Usuario:', user.email);
    console.log('📦 Nuevo plan:', newPlanId);

    // ✅ OBTENER SUSCRIPCIÓN ACTUAL
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id
    });

    if (subs.length === 0 || !subs[0].stripe_subscription_id) {
      return Response.json({ 
        error: 'No tienes una suscripción activa' 
      }, { status: 404 });
    }

    const currentSub = subs[0];
    const stripeSubscriptionId = currentSub.stripe_subscription_id;

    // ✅ OBTENER NUEVO PLAN
    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
      plan_id: newPlanId
    });

    const newPlan = plans[0];
    if (!newPlan || !newPlan.stripe_price_id) {
      return Response.json({ 
        error: 'Plan no encontrado o no configurado en Stripe' 
      }, { status: 404 });
    }

    console.log('💼 Nuevo plan:', newPlan.nombre, '- Price ID:', newPlan.stripe_price_id);

    // ✅ OBTENER SUSCRIPCIÓN DE STRIPE
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    console.log('📊 Suscripción actual en Stripe:', stripeSubscription.status);

    // ✅ ACTUALIZAR SUSCRIPCIÓN EN STRIPE CON PRORRATEO
    const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPlan.stripe_price_id,
      }],
      proration_behavior: 'always_invoice', // ✅ Prorrateo automático
      metadata: {
        upgraded_at: new Date().toISOString(),
        previous_plan: currentSub.plan_id,
        new_plan: newPlanId
      }
    });

    console.log('✅ Suscripción actualizada en Stripe');

    // ✅ ACTUALIZAR EN BASE DE DATOS
    await base44.asServiceRole.entities.Subscription.update(currentSub.id, {
      plan_id: newPlanId,
      plan_nombre: newPlan.nombre,
      plan_precio: newPlan.precio,
      fecha_expiracion: new Date(updatedSubscription.current_period_end * 1000).toISOString()
    });

    console.log('✅ Suscripción actualizada en BD');

    // ✅ ENVIAR EMAIL DE CONFIRMACIÓN
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: '✅ Plan actualizado correctamente - MisAutónomos',
      body: `
<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial;background:#f8fafc}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px}.header{background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:30px;text-align:center;border-radius:16px 16px 0 0}.header h1{color:#fff;margin:0}.content{padding:30px}.success{background:#ecfdf5;border-left:4px solid #10b981;padding:16px;margin:20px 0}.button{display:inline-block;background:#3b82f6;color:#fff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:bold}</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>✅ Plan actualizado</h1>
  </div>
  <div class="content">
    <div class="success">
      <p><strong>Tu plan se ha mejorado correctamente</strong></p>
    </div>
    <p><strong>Nuevo plan:</strong> ${newPlan.nombre}</p>
    <p><strong>Precio:</strong> ${newPlan.precio}€/mes</p>
    <p>El cambio es efectivo de inmediato. El próximo cobro se ajustará automáticamente con el prorrateo correspondiente.</p>
    <p style="text-align:center;margin:30px 0">
      <a href="https://misautonomos.es/SubscriptionManagement" class="button">Ver mi suscripción →</a>
    </p>
  </div>
</div>
</body>
</html>`,
      from_name: "MisAutónomos"
    });

    console.log('📧 Email de confirmación enviado');

    return Response.json({
      ok: true,
      message: 'Plan actualizado correctamente',
      newPlan: {
        nombre: newPlan.nombre,
        precio: newPlan.precio
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return Response.json({ 
      error: error.message || 'Error al actualizar el plan' 
    }, { status: 500 });
  }
});