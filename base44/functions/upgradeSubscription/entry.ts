import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    console.log('[upgradeSubscription] Request received');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      console.log('[upgradeSubscription] No authenticated user');
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { newPlanId } = await req.json();
    console.log(`[upgradeSubscription] User ${user.id} upgrading to ${newPlanId}`);

    if (!newPlanId) {
      return Response.json({ ok: false, error: 'Missing newPlanId' }, { status: 400 });
    }

    // 1. Fetch current subscription from DB
    const subs = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id
    });
    const currentSub = subs[0];

    if (!currentSub) {
      console.log('[upgradeSubscription] No subscription found for user');
      return Response.json({ ok: false, error: 'No subscription found' }, { status: 400 });
    }

    console.log(`[upgradeSubscription] Current plan: ${currentSub.plan_id}, Current Stripe ID: ${currentSub.stripe_subscription_id}`);

    // 2. Fetch new plan details
    const newPlans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
      plan_id: newPlanId
    });
    const newPlan = newPlans[0];

    if (!newPlan || !newPlan.stripe_price_id) {
      console.log(`[upgradeSubscription] Plan ${newPlanId} not found or missing stripe_price_id`);
      return Response.json({ ok: false, error: `Plan ${newPlanId} not configured` }, { status: 400 });
    }

    console.log(`[upgradeSubscription] New plan price ID: ${newPlan.stripe_price_id}`);

    // 3. Update Stripe subscription with new price
    if (!currentSub.stripe_subscription_id) {
      console.log('[upgradeSubscription] No Stripe subscription ID found');
      return Response.json({ ok: false, error: 'No Stripe subscription to upgrade' }, { status: 400 });
    }

    try {
      const updatedStripeSubscription = await stripe.subscriptions.update(
        currentSub.stripe_subscription_id,
        {
          items: [
            {
              id: (await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id)).items.data[0].id,
              price: newPlan.stripe_price_id,
            }
          ],
          proration_behavior: 'create_prorations',
          billing_cycle_anchor: 'unchanged',
        }
      );

      console.log(`[upgradeSubscription] Stripe subscription updated, new amount due: ${updatedStripeSubscription.amount_due}`);

      // 4. Update local DB subscription
      const newExpirationDate = new Date();
      newExpirationDate.setDate(newExpirationDate.getDate() + newPlan.duracion_dias);

      await base44.asServiceRole.entities.Subscription.update(currentSub.id, {
        plan_id: newPlanId,
        plan_nombre: newPlan.nombre,
        plan_precio: newPlan.precio,
        fecha_expiracion: newExpirationDate.toISOString(),
        estado: 'activo',
        stripe_price_id: newPlan.stripe_price_id,
      });

      console.log(`[upgradeSubscription] DB subscription updated successfully`);

      // 5. Send confirmation email
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Plan actualizado a ${newPlan.nombre} - MisAutónomos`,
          body: `
            <h2>¡Felicidades!</h2>
            <p>Tu plan ha sido actualizado a <strong>${newPlan.nombre}</strong></p>
            <p><strong>Nuevo precio:</strong> ${newPlan.precio}€/mes</p>
            <p>Los cambios se reflejarán en tu próxima factura. Se ha aplicado el prorrateo automático.</p>
            <p>Disfruta de todas las nuevas funcionalidades.</p>
          `,
        });
        console.log('[upgradeSubscription] Confirmation email sent');
      } catch (emailError) {
        console.warn('[upgradeSubscription] Email send failed, but upgrade completed:', emailError.message);
      }

      return Response.json({
        ok: true,
        message: `Plan actualizado a ${newPlan.nombre}`,
        plan: newPlan.nombre,
        price: newPlan.precio,
      });

    } catch (stripeError) {
      console.error('[upgradeSubscription] Stripe API error:', stripeError.message);
      return Response.json(
        { ok: false, error: `Stripe error: ${stripeError.message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[upgradeSubscription] Unexpected error:', error);
    return Response.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});