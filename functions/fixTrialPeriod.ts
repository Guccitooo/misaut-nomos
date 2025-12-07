import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  console.log('🔧 ========== CORRECCIÓN DE PERIODOS DE PRUEBA ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    console.log('👤 Admin ejecutando corrección:', user.email);

    // Buscar todas las suscripciones activas en trial de 60 días
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      estado: 'en_prueba'
    });

    console.log(`📊 Suscripciones en prueba encontradas: ${subscriptions.length}`);

    let fixed = 0;
    let errors = 0;

    for (const sub of subscriptions) {
      try {
        if (!sub.stripe_subscription_id) {
          console.log(`⚠️ Suscripción ${sub.id} sin stripe_subscription_id`);
          continue;
        }

        // Obtener suscripción de Stripe
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

        if (stripeSub.status === 'trialing') {
          const trialEnd = stripeSub.trial_end;
          const trialStart = stripeSub.trial_start || stripeSub.created;
          const currentTrialDays = Math.ceil((trialEnd - trialStart) / 86400);

          console.log(`🔍 Suscripción ${sub.stripe_subscription_id}: ${currentTrialDays} días de prueba`);

          if (currentTrialDays > 7) {
            // Calcular nueva fecha de fin de trial (7 días desde hoy)
            const newTrialEnd = Math.floor(Date.now() / 1000) + (7 * 86400);

            // Actualizar en Stripe
            await stripe.subscriptions.update(sub.stripe_subscription_id, {
              trial_end: newTrialEnd
            });

            // Actualizar en base de datos
            await base44.asServiceRole.entities.Subscription.update(sub.id, {
              fecha_expiracion: new Date(newTrialEnd * 1000).toISOString()
            });

            console.log(`✅ Corregida: ${sub.stripe_subscription_id} - Nueva expiración: ${new Date(newTrialEnd * 1000).toISOString()}`);
            fixed++;
          }
        }
      } catch (err) {
        console.error(`❌ Error procesando ${sub.id}:`, err.message);
        errors++;
      }
    }

    console.log(`✅ Proceso completado: ${fixed} corregidas, ${errors} errores`);

    return Response.json({
      success: true,
      total: subscriptions.length,
      fixed,
      errors,
      message: `Se corrigieron ${fixed} suscripciones a 7 días de prueba`
    });

  } catch (error) {
    console.error('❌ Error general:', error.message);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});