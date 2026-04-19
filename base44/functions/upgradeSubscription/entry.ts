import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const NOW = new Date().toISOString();
  console.log(`[upgradeSubscription] ╔══════════════════════════════════════════════════════`);
  console.log(`[upgradeSubscription] ║ 🚀 UPGRADE REQUEST STARTED AT ${NOW}`);
  console.log(`[upgradeSubscription] ║ This is the REAL upgradeSubscription function in Deno`);
  console.log(`[upgradeSubscription] ╚══════════════════════════════════════════════════════`);
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    console.log(`[upgradeSubscription] ✓ User authenticated: ${user?.email} (ID: ${user?.id})`);
    
    if (!user) {
      console.log('[upgradeSubscription] ❌ FAIL: No authenticated user - returning 401');
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { newPlanId } = body;
    console.log(`[upgradeSubscription] ✓ Parsed request body: newPlanId = ${newPlanId}`);

    if (!newPlanId) {
      console.log('[upgradeSubscription] ❌ Missing newPlanId in request body');
      return Response.json({ ok: false, error: 'Missing newPlanId' }, { status: 400 });
    }

    // Step 1: Get current subscription from DB
    console.log('[upgradeSubscription] 🔍 Step 1: Fetching current subscription from DB...');
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id
    });
    const currentSub = subs[0];

    if (!currentSub) {
      console.log('[upgradeSubscription] ❌ No subscription found in DB');
      return Response.json({ ok: false, error: 'No subscription found' }, { status: 400 });
    }

    console.log(`[upgradeSubscription] ✅ Current subscription found:`);
    console.log(`   - plan_id: ${currentSub.plan_id}`);
    console.log(`   - stripe_subscription_id: ${currentSub.stripe_subscription_id}`);
    console.log(`   - stripe_customer_id: ${currentSub.stripe_customer_id}`);
    console.log(`   - estado: ${currentSub.estado}`);

    // Step 2: Get new plan details
    console.log('[upgradeSubscription] 🔍 Step 2: Fetching new plan details...');
    const newPlans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
      plan_id: newPlanId
    });
    const newPlan = newPlans[0];

    if (!newPlan) {
      console.log(`[upgradeSubscription] ❌ Plan ${newPlanId} not found in DB`);
      return Response.json({ ok: false, error: `Plan ${newPlanId} not found` }, { status: 400 });
    }

    if (!newPlan.stripe_price_id) {
      console.log(`[upgradeSubscription] ❌ Plan ${newPlanId} has no stripe_price_id configured`);
      return Response.json({ ok: false, error: `Plan ${newPlanId} not configured in Stripe` }, { status: 400 });
    }

    console.log(`[upgradeSubscription] ✅ New plan found:`);
    console.log(`   - nombre: ${newPlan.nombre}`);
    console.log(`   - precio: ${newPlan.precio}€`);
    console.log(`   - stripe_price_id: ${newPlan.stripe_price_id}`);

    // Step 3: Validate Stripe subscription exists
    if (!currentSub.stripe_subscription_id) {
      console.log('[upgradeSubscription] ❌ No stripe_subscription_id in current subscription');
      return Response.json({ ok: false, error: 'No Stripe subscription ID found' }, { status: 400 });
    }

    // Step 4: Retrieve Stripe subscription and get subscription item ID
    console.log('[upgradeSubscription] 🔍 Step 3: Retrieving Stripe subscription details...');
    let stripeSubscription;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id);
      console.log(`[upgradeSubscription] ✅ Stripe subscription retrieved`);
      console.log(`   - status: ${stripeSubscription.status}`);
      console.log(`   - items count: ${stripeSubscription.items.data.length}`);
    } catch (error) {
      console.log(`[upgradeSubscription] ❌ Failed to retrieve Stripe subscription: ${error.message}`);
      return Response.json({ ok: false, error: `Cannot access Stripe subscription: ${error.message}` }, { status: 400 });
    }

    if (!stripeSubscription.items.data[0]) {
      console.log('[upgradeSubscription] ❌ No subscription items found in Stripe');
      return Response.json({ ok: false, error: 'No subscription items in Stripe' }, { status: 400 });
    }

    const subscriptionItemId = stripeSubscription.items.data[0].id;
    console.log(`[upgradeSubscription] ✅ Subscription item ID: ${subscriptionItemId}`);

    // Step 5: Update Stripe subscription
    console.log('[upgradeSubscription] 🔄 Step 4: Updating Stripe subscription...');
    console.log(`[upgradeSubscription] Calling stripe.subscriptions.update with:`);
    console.log(`   - subscription_id: ${currentSub.stripe_subscription_id}`);
    console.log(`   - item_id: ${subscriptionItemId}`);
    console.log(`   - new_price_id: ${newPlan.stripe_price_id}`);
    
    let updatedStripeSubscription;
    try {
      updatedStripeSubscription = await stripe.subscriptions.update(
        currentSub.stripe_subscription_id,
        {
          items: [
            {
              id: subscriptionItemId,
              price: newPlan.stripe_price_id,
            }
          ],
          proration_behavior: 'create_prorations',
          cancel_at_period_end: false,
          trial_end: 'now',  // Terminar el trial inmediatamente si está activo
        }
      );
      console.log(`[upgradeSubscription] ✅ Stripe subscription updated successfully`);
      console.log(`   - new status: ${updatedStripeSubscription.status}`);
      console.log(`   - current_period_start: ${updatedStripeSubscription.current_period_start}`);
      console.log(`   - current_period_end: ${updatedStripeSubscription.current_period_end}`);
      console.log(`   - amount_due: ${updatedStripeSubscription.amount_due}`);
      console.log(`   - billing_reason: ${updatedStripeSubscription.billing_reason}`);
      console.log(`   - latest_invoice: ${updatedStripeSubscription.latest_invoice}`);
      
      // Verificar que el precio se cambió realmente
      const updatedItem = updatedStripeSubscription.items.data[0];
      console.log(`[upgradeSubscription] Updated item price_id: ${updatedItem.price.id}`);
      if (updatedItem.price.id !== newPlan.stripe_price_id) {
        console.error(`[upgradeSubscription] ❌ CRITICAL: Price ID mismatch! Expected ${newPlan.stripe_price_id}, got ${updatedItem.price.id}`);
        throw new Error(`Stripe price update verification failed: price was not actually changed`);
      }
    } catch (error) {
      console.error(`[upgradeSubscription] ❌ Stripe update failed: ${error.message}`);
      console.error(`[upgradeSubscription] Full error:`, error);
      return Response.json(
        { ok: false, error: `Stripe update failed: ${error.message}` },
        { status: 400 }
      );
    }

    // Step 6: Update subscription in DB
    console.log('[upgradeSubscription] 💾 Step 5: Updating subscription in database...');
    const newExpirationDate = new Date();
    newExpirationDate.setDate(newExpirationDate.getDate() + newPlan.duracion_dias);

    try {
      console.log('[upgradeSubscription] Calling .update() with:');
      console.log(`   - id: ${currentSub.id}`);
      console.log(`   - plan_id: ${newPlanId}`);
      console.log(`   - plan_nombre: ${newPlan.nombre}`);
      console.log(`   - plan_precio: ${newPlan.precio}`);
      console.log(`   - estado: activo`);
      
      const updateResult = await base44.asServiceRole.entities.Subscription.update(currentSub.id, {
        plan_id: newPlanId,
        plan_nombre: newPlan.nombre,
        plan_precio: newPlan.precio,
        fecha_expiracion: newExpirationDate.toISOString(),
        estado: 'activo',
        stripe_price_id: newPlan.stripe_price_id,
      });
      
      console.log(`[upgradeSubscription] ✅ Subscription update call completed`);
      console.log('[upgradeSubscription] Update result:', updateResult);
      
      // VERIFICACIÓN: Leer la suscripción nuevamente para confirmar que se guardó
      const verifyRead = await base44.asServiceRole.entities.Subscription.filter({
        id: currentSub.id
      });
      
      if (verifyRead && verifyRead.length > 0) {
        const updatedRecord = verifyRead[0];
        console.log('[upgradeSubscription] ✅ VERIFICATION - Updated record in DB:');
        console.log(`   - plan_id: ${updatedRecord.plan_id}`);
        console.log(`   - plan_precio: ${updatedRecord.plan_precio}`);
        console.log(`   - estado: ${updatedRecord.estado}`);
        
        if (updatedRecord.plan_id !== newPlanId) {
          throw new Error(`CRITICAL: Plan ID was not actually updated! DB shows ${updatedRecord.plan_id} but we tried to set ${newPlanId}`);
        }
      }
    } catch (error) {
      console.error(`[upgradeSubscription] ❌ Failed to update subscription in DB: ${error.message}`);
      console.error('[upgradeSubscription] Error stack:', error.stack);
      return Response.json(
        { ok: false, error: `Database update failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Step 7: Create PaymentRecord for the prorated charge
    if (updatedStripeSubscription.amount_due > 0) {
      console.log('[upgradeSubscription] 💾 Step 6: Creating PaymentRecord for prorated charge...');
      try {
        await base44.asServiceRole.entities.PaymentRecord.create({
          user_id: user.id,
          user_email: user.email,
          stripe_subscription_id: currentSub.stripe_subscription_id,
          stripe_invoice_id: updatedStripeSubscription.latest_invoice || '',
          stripe_payment_intent_id: '',
          amount: updatedStripeSubscription.amount_due / 100, // Stripe returns cents
          currency: 'EUR',
          plan_id: newPlanId,
          plan_nombre: newPlan.nombre,
          payment_date: new Date().toISOString(),
          period_start: new Date().toISOString(),
          period_end: newExpirationDate.toISOString(),
          status: 'pending',
          is_trial: false,
          metadata: {
            upgrade_from: currentSub.plan_id,
            upgrade_to: newPlanId,
            proration_reason: 'plan_upgrade'
          }
        });
        console.log(`[upgradeSubscription] ✅ PaymentRecord created`);
      } catch (error) {
        console.warn(`[upgradeSubscription] ⚠️  Failed to create PaymentRecord: ${error.message}`);
        // Don't fail the upgrade if PaymentRecord creation fails
      }
    }

    // Step 8: Send confirmation email
    console.log('[upgradeSubscription] 📧 Step 7: Sending confirmation email...');
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `✅ Plan actualizado a ${newPlan.nombre} - MisAutónomos`,
        body: `
          <h2>¡Tu plan ha sido actualizado!</h2>
          <p>Tu suscripción cambió exitosamente a <strong>${newPlan.nombre}</strong></p>
          <p><strong>Nuevo precio:</strong> ${newPlan.precio}€/mes</p>
          <p><strong>Próximo cobro:</strong> ${new Date(newExpirationDate).toLocaleDateString('es-ES')}</p>
          ${updatedStripeSubscription.amount_due > 0 ? `<p><strong>Prorrateo aplicado:</strong> Se ha cobrado ${(updatedStripeSubscription.amount_due / 100).toFixed(2)}€ en esta actualización.</p>` : ''}
          <p>Accede a tu dashboard para disfrutar de todas las nuevas funcionalidades.</p>
        `,
      });
      console.log('[upgradeSubscription] ✅ Confirmation email sent');
    } catch (emailError) {
      console.warn(`[upgradeSubscription] ⚠️  Email send failed (non-blocking): ${emailError.message}`);
    }

    console.log('[upgradeSubscription] ===== ✅ UPGRADE COMPLETED SUCCESSFULLY =====');
    return Response.json({
      ok: true,
      message: `Plan actualizado a ${newPlan.nombre}`,
      plan: newPlan.nombre,
      price: newPlan.precio,
      amountCharged: updatedStripeSubscription.amount_due / 100,
      nextBillingDate: newExpirationDate.toISOString(),
    });

  } catch (error) {
    console.error('[upgradeSubscription] ===== ❌ UNEXPECTED ERROR =====');
    console.error('[upgradeSubscription] Error name:', error.name);
    console.error('[upgradeSubscription] Error message:', error.message);
    console.error('[upgradeSubscription] Error stack:', error.stack);
    return Response.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});