import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

Deno.serve(async (req) => {
  console.log('🔴 ========== CANCELAR SUSCRIPCIÓN ==========');
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 Usuario:', user.email);

    // 🔥 1. OBTENER SUSCRIPCIÓN ACTIVA
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
    const activeSub = subscriptions.find(s => s.estado === 'activo' || s.estado === 'en_prueba');

    if (!activeSub) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    console.log('📋 Suscripción encontrada:', activeSub.id, 'Plan:', activeSub.plan_nombre);

    // 🔥 2. CANCELAR EN STRIPE (cancel_at_period_end)
    if (activeSub.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(activeSub.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
        console.log('✅ Cancelado en Stripe (cancel_at_period_end)');
      } catch (stripeError) {
        console.error('⚠️ Error en Stripe (continuamos):', stripeError.message);
      }
    }

    // 🔥 3. ACTUALIZAR SUSCRIPCIÓN EN BD
    await base44.asServiceRole.entities.Subscription.update(activeSub.id, {
      estado: 'cancelado',
      renovacion_automatica: false,
    });
    console.log('✅ Suscripción marcada como cancelada en BD');

    // 🔥 4. OCULTAR PERFIL INMEDIATAMENTE
    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: user.id });
    let profileInfo = null;
    
    if (profiles.length > 0) {
      const profile = profiles[0];
      profileInfo = {
        ciudad: profile.ciudad,
        categoria: profile.categories?.[0] || 'Sin categoría'
      };
      
      await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
        visible_en_busqueda: false,
        estado_perfil: 'inactivo'
      });
      console.log('✅ Perfil oculto en búsquedas');

      // 🔥 5. LIBERAR PLAZA
      if (profile.ciudad && profile.categories && profile.categories.length > 0) {
        const category = profile.categories[0];
        console.log(`🔓 Plaza liberada en ${profile.ciudad} - ${category}`);
      }
    }

    // 🔥 6. EMAIL DE DESPEDIDA
    const endDate = new Date(activeSub.fecha_expiracion).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const userName = user.full_name || user.email.split('@')[0];
    const cityName = profileInfo?.ciudad || 'tu ciudad';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: '👋 Confirmación de cancelación - MisAutónomos',
      body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; }
    .header { background: linear-gradient(135deg, #64748b, #475569); padding: 40px; text-align: center; border-radius: 16px 16px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 40px; }
    .info-box { background: #f1f5f9; border-left: 4px solid #64748b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; border-radius: 0 0 16px 16px; font-size: 13px; }
    .footer a { color: #60a5fa; text-decoration: none; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="MisAutónomos" style="width: 64px; height: 64px; border-radius: 12px; margin-bottom: 16px;" />
      <h1>👋 Cancelación confirmada</h1>
    </div>
    <div class="content">
      <p style="font-size: 18px; color: #1f2937;">Hola <strong>${userName}</strong>,</p>
      
      <div class="info-box">
        <h3 style="color: #475569; margin: 0 0 12px 0;">✅ Tu suscripción ha sido cancelada correctamente</h3>
        <p style="color: #334155; margin: 0;">No se realizarán más cobros a tu tarjeta.</p>
      </div>

      <p><strong>Detalles de la cancelación:</strong></p>
      <ul>
        <li><strong>Plan cancelado:</strong> ${activeSub.plan_nombre}</li>
        <li><strong>Fin de acceso:</strong> ${endDate}</li>
        <li><strong>Tu perfil:</strong> Oculto en búsquedas (inmediato)</li>
      </ul>

      <div class="warning-box">
        <p style="color: #92400e; margin: 0;"><strong>⚠️ Plaza liberada en ${cityName}</strong></p>
        <p style="color: #78350f; margin: 8px 0 0 0; font-size: 14px;">Solo hay 10 plazas por ciudad. Si vuelves más tarde, puede que esté ocupada.</p>
      </div>

      <p style="color: #475569; font-size: 15px; line-height: 1.6;">
        Sentimos verte partir. Si cambias de opinión, puedes reactivar tu perfil en cualquier momento (sujeto a disponibilidad).
      </p>

      <div class="cta">
        <a href="https://misautonomos.es/PricingPlans" class="button">Volver a suscribirme →</a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 30px;">
        ¿Algún problema o sugerencia? Escríbenos a 
        <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6;">soporte@misautonomos.es</a>
      </p>
    </div>
    <div class="footer">
      <strong style="color: #fff;">MisAutónomos</strong><br/>
      <a href="https://misautonomos.es">misautonomos.es</a> · 
      <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a>
    </div>
  </div>
</body>
</html>`,
      from_name: "MisAutónomos"
    });
    console.log('📧 Email de despedida enviado');

    console.log('✅ ========== CANCELACIÓN COMPLETADA ==========');

    return Response.json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      end_date: activeSub.fecha_expiracion
    });

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});