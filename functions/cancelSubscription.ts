import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
    const activeSub = subscriptions.find(s => s.estado === 'activo' || s.estado === 'en_prueba');

    if (!activeSub) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Cancelar en Stripe
    if (activeSub.stripe_subscription_id) {
      await stripe.subscriptions.update(activeSub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    // Actualizar en DB
    await base44.entities.Subscription.update(activeSub.id, {
      estado: 'cancelado',
      renovacion_automatica: false,
    });
    
    // Ocultar perfil
    const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
    if (profiles[0]) {
      await base44.entities.ProfessionalProfile.update(profiles[0].id, {
        visible_en_busqueda: false,
        estado_perfil: 'inactivo'
      });
    }

    // Enviar email de confirmación de baja
    // (Añadir la llamada a la plantilla de email aquí si la tienes)

    return Response.json({ success: true, message: 'Subscription cancelled successfully' });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});