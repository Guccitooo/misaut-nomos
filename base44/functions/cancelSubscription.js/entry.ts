
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`🔴 ========== CANCELACIÓN DE SUSCRIPCIÓN ==========`);
        console.log(`👤 Usuario: ${user.email} (ID: ${user.id})`);

        // Get user's subscription
        const subscriptions = await base44.entities.Subscription.filter({
            user_id: user.id
        });

        if (subscriptions.length === 0) {
            console.log('❌ No se encontró suscripción para el usuario');
            return Response.json({ 
                error: 'No tienes una suscripción activa' 
            }, { status: 404 });
        }

        const subscription = subscriptions[0];
        console.log(`📋 Suscripción encontrada:`, {
            id: subscription.id,
            stripe_subscription_id: subscription.stripe_subscription_id,
            estado: subscription.estado,
            fecha_expiracion: subscription.fecha_expiracion
        });

        let stripeCanceled = false;
        let stripeError = null;

        // ✅ CRÍTICO: Cancelar en Stripe con cancel_at_period_end
        if (subscription.stripe_subscription_id) {
            try {
                console.log(`🔄 Intentando cancelar en Stripe: ${subscription.stripe_subscription_id}`);
                
                // ✅ Usar update en lugar de cancel para mantener acceso hasta el final del período
                const updated = await stripe.subscriptions.update(
                    subscription.stripe_subscription_id,
                    {
                        cancel_at_period_end: true, // ✅ Cancelar al final del período
                        metadata: {
                            canceled_by: user.email,
                            canceled_at: new Date().toISOString(),
                            canceled_from: 'user_dashboard'
                        }
                    }
                );
                
                console.log(`✅ Suscripción actualizada en Stripe:`, {
                    id: updated.id,
                    status: updated.status,
                    cancel_at_period_end: updated.cancel_at_period_end,
                    current_period_end: new Date(updated.current_period_end * 1000).toISOString()
                });
                
                stripeCanceled = true;
            } catch (error) {
                console.error(`❌ Error cancelando en Stripe:`, error);
                stripeError = error.message;
                
                // ✅ Si la suscripción no existe en Stripe, continuar con la cancelación local
                if (error.code === 'resource_missing') {
                    console.log('⚠️ Suscripción no encontrada en Stripe, continuando con cancelación local');
                    stripeCanceled = true; // Marcar como "cancelado" para continuar
                }
            }
        } else {
            console.log('⚠️ No hay stripe_subscription_id, solo cancelación local');
            stripeCanceled = true; // Si no hay ID de Stripe, continuar
        }

        // ✅ Actualizar estado en base de datos
        await base44.entities.Subscription.update(subscription.id, {
            estado: "cancelado",
            renovacion_automatica: false
        });
        console.log('✅ Suscripción actualizada en BD local: estado = cancelado');

        // ✅ Actualizar usuario
        await base44.auth.updateMe({
            subscription_status: "cancelado"
        });
        console.log('✅ Usuario actualizado: subscription_status = cancelado');

        // ✅ Ocultar perfil INMEDIATAMENTE
        const profiles = await base44.entities.ProfessionalProfile.filter({
            user_id: user.id
        });

        if (profiles.length > 0) {
            await base44.entities.ProfessionalProfile.update(profiles[0].id, {
                visible_en_busqueda: false,
                estado_perfil: "inactivo"
            });
            console.log(`✅ Perfil ocultado de búsquedas (ID: ${profiles[0].id})`);
        }

        // ✅ Enviar email de confirmación
        try {
            const userEmail = user.email;
            const userName = user.full_name || user.email;

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: userEmail,
                subject: '❌ Tu suscripción en Misautónomos ha sido cancelada',
                body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .warning-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 25px; margin: 25px 0; border-radius: 8px; }
    .warning-box h3 { color: #991b1b; margin: 0 0 15px 0; font-size: 20px; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-box p { color: #1e40af; margin: 0; }
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
      <div class="logo">❌</div>
      <h1>Suscripción cancelada</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${userName},</p>
      
      <p class="message">
        Tu suscripción en <strong>Misautónomos</strong> ha sido cancelada correctamente.
      </p>
      
      <div class="warning-box">
        <h3>⚠️ Tu cuenta está ahora inactiva</h3>
        <p style="color: #991b1b; margin: 0;">
          Tu perfil profesional ya no es visible en las búsquedas y no podrás recibir nuevos contactos de clientes.
        </p>
      </div>
      
      <div class="info-box">
        <p>
          <strong>📦 Todos tus datos permanecen guardados:</strong><br/>
          • Tu perfil profesional completo<br/>
          • Tus fotos y galería de trabajos<br/>
          • Tus valoraciones y reseñas<br/>
          • Tu historial de mensajes
        </p>
      </div>
      
      <p class="message">
        Puedes reactivar tu cuenta en cualquier momento contratando un nuevo plan.
      </p>
      
      <div class="cta">
        <a href="https://autonomosmil.es/PricingPlans" class="button">
          Reactivar mi cuenta →
        </a>
      </div>
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        Si tienes alguna duda, contacta con nosotros:<br/>
        <a href="mailto:soporte@autonomosmil.es" style="color: #3b82f6; text-decoration: none;">soporte@autonomosmil.es</a>
      </p>
    </div>
    
    <div class="footer">
      <strong>Equipo Misautónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@autonomosmil.es">soporte@autonomosmil.es</a><br/>
        <a href="https://autonomosmil.es">autonomosmil.es</a>
      </p>
    </div>
  </div>
</body>
</html>
                `,
                from_name: 'Misautónomos'
            });
            console.log('✅ Email de cancelación enviado');
        } catch (emailError) {
            console.error('⚠️ Error enviando email (no crítico):', emailError);
        }

        console.log(`✅ ========== CANCELACIÓN COMPLETADA ==========\n`);

        return Response.json({
            ok: true,
            message: 'Suscripción cancelada correctamente',
            details: {
                stripe_canceled: stripeCanceled,
                stripe_error: stripeError,
                fecha_expiracion: subscription.fecha_expiracion,
                profile_hidden: profiles.length > 0
            }
        });

    } catch (error) {
        console.error('❌ Error crítico cancelando suscripción:', error);
        return Response.json({
            ok: false,
            error: 'Error al cancelar la suscripción',
            details: error.message
        }, { status: 500 });
    }
});
