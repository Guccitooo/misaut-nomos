import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`🔄 ========== REACTIVACIÓN DE SUSCRIPCIÓN ==========`);
        console.log(`👤 Usuario: ${user.email} (ID: ${user.id})`);

        const subscriptions = await base44.entities.Subscription.filter({
            user_id: user.id
        });

        if (subscriptions.length === 0) {
            console.log('❌ No se encontró suscripción para el usuario');
            return Response.json({ 
                error: 'No tienes una suscripción' 
            }, { status: 404 });
        }

        const subscription = subscriptions[0];
        console.log(`📋 Suscripción encontrada:`, {
            id: subscription.id,
            stripe_subscription_id: subscription.stripe_subscription_id,
            estado: subscription.estado,
            fecha_expiracion: subscription.fecha_expiracion
        });

        if (subscription.estado !== "cancelado") {
            return Response.json({
                error: 'La suscripción no está cancelada'
            }, { status: 400 });
        }

        const today = new Date();
        const expiration = new Date(subscription.fecha_expiracion);
        const daysLeft = Math.ceil((expiration - today) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
            console.log('❌ Suscripción expirada, debe crear una nueva');
            return Response.json({
                error: 'La suscripción ha expirado. Debes contratar un nuevo plan.',
                requiresNewCheckout: true
            }, { status: 400 });
        }

        // ✅ VERIFICAR SI HAY MÚLTIPLES SUSCRIPCIONES EN STRIPE
        if (subscription.stripe_subscription_id) {
            try {
                const stripeSubscription = await stripe.subscriptions.retrieve(
                    subscription.stripe_subscription_id
                );
                
                if (stripeSubscription.customer) {
                    const allSubscriptions = await stripe.subscriptions.list({
                        customer: stripeSubscription.customer,
                        limit: 100
                    });

                    const activeSubscriptions = allSubscriptions.data.filter(sub => 
                        sub.status === 'active' || sub.status === 'trialing'
                    );

                    if (activeSubscriptions.length > 1) {
                        console.log(`⚠️ ALERTA: Usuario con ${activeSubscriptions.length} suscripciones activas en Stripe`);
                        console.log('IDs:', activeSubscriptions.map(s => s.id));
                        
                        // Cancelar las suscripciones duplicadas (mantener solo la más reciente)
                        const sortedSubs = activeSubscriptions.sort((a, b) => b.created - a.created);
                        for (let i = 1; i < sortedSubs.length; i++) {
                            try {
                                await stripe.subscriptions.cancel(sortedSubs[i].id);
                                console.log(`✅ Suscripción duplicada cancelada: ${sortedSubs[i].id}`);
                            } catch (cancelError) {
                                console.error(`❌ Error cancelando duplicado ${sortedSubs[i].id}:`, cancelError);
                            }
                        }
                    }
                }
            } catch (verifyError) {
                console.error('⚠️ Error verificando duplicados:', verifyError);
            }
        }

        let stripeReactivated = false;
        let stripeError = null;

        if (subscription.stripe_subscription_id) {
            try {
                console.log(`🔄 Reactivando en Stripe: ${subscription.stripe_subscription_id}`);
                
                const updated = await stripe.subscriptions.update(
                    subscription.stripe_subscription_id,
                    {
                        cancel_at_period_end: false,
                        metadata: {
                            reactivated_by: user.email,
                            reactivated_at: new Date().toISOString(),
                            reactivated_from: 'user_dashboard'
                        }
                    }
                );
                
                console.log(`✅ Suscripción reactivada en Stripe:`, {
                    id: updated.id,
                    status: updated.status,
                    cancel_at_period_end: updated.cancel_at_period_end
                });
                
                stripeReactivated = true;
            } catch (error) {
                console.error(`❌ Error reactivando en Stripe:`, error);
                stripeError = error.message;
                
                if (error.code === 'resource_missing') {
                    console.log('⚠️ Suscripción no encontrada en Stripe, continuando con reactivación local');
                    stripeReactivated = true;
                }
            }
        } else {
            console.log('⚠️ No hay stripe_subscription_id, solo reactivación local');
            stripeReactivated = true;
        }

        const newStatus = subscription.plan_id === 'plan_trial' ? 'en_prueba' : 'activo';

        await base44.entities.Subscription.update(subscription.id, {
            estado: newStatus,
            renovacion_automatica: true
        });
        console.log(`✅ Suscripción actualizada en BD: estado = ${newStatus}`);

        await base44.auth.updateMe({
            subscription_status: newStatus
        });
        console.log(`✅ Usuario actualizado: subscription_status = ${newStatus}`);

        const profiles = await base44.entities.ProfessionalProfile.filter({
            user_id: user.id
        });

        if (profiles.length > 0) {
            await base44.entities.ProfessionalProfile.update(profiles[0].id, {
                visible_en_busqueda: true,
                estado_perfil: "activo"
            });
            console.log(`✅ Perfil visible en búsquedas (ID: ${profiles[0].id})`);
        }

        try {
            const userName = user.full_name || user.email;
            
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: user.email,
                subject: "¡Suscripción reactivada! - MisAutónomos",
                body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 80px; height: 80px; margin: 0 auto 20px; background: white; border-radius: 16px; padding: 12px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .success-box h3 { color: #065f46; margin: 0 0 15px 0; font-size: 18px; }
    .success-box p { color: #047857; margin: 5px 0; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png" alt="MisAutónomos" class="logo" />
      <h1>¡Bienvenido de nuevo! 🎉</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${userName},</p>
      
      <p class="message">
        ¡Excelente noticia! Tu suscripción en <strong>MisAutónomos</strong> ha sido reactivada correctamente.
      </p>
      
      <div class="success-box">
        <h3>✅ Tu perfil ya está activo</h3>
        <p><strong>Plan:</strong> ${subscription.plan_nombre || 'N/A'}</p>
        <p><strong>Estado:</strong> Activo</p>
        <p><strong>Válido hasta:</strong> ${expiration.toLocaleDateString('es-ES')}</p>
        <p><strong>Días restantes:</strong> ${daysLeft} días</p>
      </div>
      
      <p class="message">
        <strong>🚀 Ahora puedes:</strong>
      </p>
      <ul style="color: #4b5563; line-height: 1.8; margin-bottom: 25px;">
        <li>✓ Tu perfil es visible en todas las búsquedas</li>
        <li>✓ Los clientes pueden contactarte directamente</li>
        <li>✓ Recibirás notificaciones de nuevos mensajes</li>
        <li>✓ Acceso completo a todas las funcionalidades</li>
      </ul>
      
      <div class="cta">
        <a href="https://misautonomos.es/MyProfile" class="button">
          Ir a mi perfil →
        </a>
      </div>
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        ¡Nos alegra que sigas con nosotros!<br/>
        Si tienes alguna duda: <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6; text-decoration: none;">soporte@misautonomos.es</a>
      </p>
    </div>
    
    <div class="footer">
      <strong>MisAutónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
                `,
                from_name: 'MisAutónomos'
            });
            console.log('✅ Email de reactivación enviado');
        } catch (emailError) {
            console.error('⚠️ Error enviando email (no crítico):', emailError);
        }

        console.log(`✅ ========== REACTIVACIÓN COMPLETADA ==========\n`);

        return Response.json({
            ok: true,
            message: '¡Suscripción reactivada! Tu perfil ya es visible para clientes.',
            details: {
                stripe_reactivated: stripeReactivated,
                stripe_error: stripeError,
                dias_restantes: daysLeft,
                fecha_expiracion: subscription.fecha_expiracion,
                profile_visible: profiles.length > 0
            }
        });

    } catch (error) {
        console.error('❌ Error crítico reactivando suscripción:', error);
        return Response.json({
            ok: false,
            error: 'Error al reactivar la suscripción',
            details: error.message
        }, { status: 500 });
    }
});