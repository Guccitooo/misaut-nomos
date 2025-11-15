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

        console.log(`🔴 ========== CANCELACIÓN DE SUSCRIPCIÓN ==========`);
        console.log(`👤 Usuario: ${user.email} (ID: ${user.id})`);

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
            fecha_expiracion: subscription.fecha_expiracion,
            plan_nombre: subscription.plan_nombre
        });

        let stripeCanceled = false;
        let stripeError = null;

        if (subscription.stripe_subscription_id) {
            try {
                console.log(`🔄 Intentando cancelar en Stripe: ${subscription.stripe_subscription_id}`);
                
                const updated = await stripe.subscriptions.update(
                    subscription.stripe_subscription_id,
                    {
                        cancel_at_period_end: true,
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
                
                if (error.code === 'resource_missing') {
                    console.log('⚠️ Suscripción no encontrada en Stripe, continuando con cancelación local');
                    stripeCanceled = true;
                }
            }
        } else {
            console.log('⚠️ No hay stripe_subscription_id, solo cancelación local');
            stripeCanceled = true;
        }

        await base44.entities.Subscription.update(subscription.id, {
            estado: "cancelado",
            renovacion_automatica: false
        });
        console.log('✅ Suscripción actualizada en BD local: estado = cancelado');

        await base44.auth.updateMe({
            subscription_status: "cancelado"
        });
        console.log('✅ Usuario actualizado: subscription_status = cancelado');

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

        try {
            const userName = user.full_name || user.email;
            const isActiveUntilEnd = stripeCanceled && (subscription.stripe_subscription_id !== null);
            
            let expirationDate = new Date();
            if (subscription.fecha_expiracion) {
                expirationDate = new Date(subscription.fecha_expiracion);
            }

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: user.email,
                subject: "Suscripción cancelada - MisAutónomos",
                body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 80px; height: 80px; margin: 0 auto 20px; background: white; border-radius: 16px; padding: 12px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .info-box { background: ${isActiveUntilEnd ? '#dbeafe' : '#fee2e2'}; border-left: 4px solid ${isActiveUntilEnd ? '#3b82f6' : '#dc2626'}; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-box h3 { color: ${isActiveUntilEnd ? '#1e40af' : '#991b1b'}; margin: 0 0 15px 0; font-size: 18px; }
    .info-box p { color: ${isActiveUntilEnd ? '#1e3a8a' : '#7f1d1d'}; margin: 5px 0; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }
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
      <h1>Suscripción cancelada</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${userName},</p>
      
      <p class="message">
        Tu solicitud de cancelación de suscripción en <strong>MisAutónomos</strong> ha sido procesada correctamente.
      </p>
      
      <div class="info-box">
        <h3>${isActiveUntilEnd ? '✅ Tu perfil sigue activo' : '❌ Perfil desactivado'}</h3>
        <p><strong>Plan:</strong> ${subscription.plan_nombre || 'N/A'}</p>
        <p><strong>Estado:</strong> ${isActiveUntilEnd ? 'Activo hasta el final del periodo' : 'Cancelado inmediatamente'}</p>
        ${isActiveUntilEnd && expirationDate ? `<p><strong>Activo hasta:</strong> ${expirationDate.toLocaleDateString('es-ES')}</p>` : ''}
      </div>
      
      ${isActiveUntilEnd && expirationDate ? `
      <p class="message">
        <strong>✅ Buenas noticias:</strong> Tu perfil profesional seguirá visible en las búsquedas hasta el <strong>${expirationDate.toLocaleDateString('es-ES')}</strong>.
      </p>
      <p class="message">
        Después de esa fecha, tu perfil se ocultará automáticamente. Podrás reactivar tu suscripción en cualquier momento sin perder tus datos.
      </p>
      ` : `
      <p class="message">
        Tu perfil profesional ha sido ocultado de las búsquedas. Puedes reactivar tu suscripción en cualquier momento para volver a aparecer.
      </p>
      `}
      
      <p class="message">
        <strong>💡 Lo que conservas:</strong>
      </p>
      <ul style="color: #4b5563; line-height: 1.8; margin-bottom: 25px;">
        <li>✓ Tu perfil completo con todos los datos</li>
        <li>✓ Todas tus fotos y galería</li>
        <li>✓ Tus valoraciones y reseñas</li>
        <li>✓ Tu historial de conversaciones</li>
      </ul>
      
      <div class="cta">
        <a href="https://misautonomos.es/PricingPlans" class="button">
          Ver planes disponibles →
        </a>
      </div>
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        Sentimos verte partir. Si cambias de opinión, estaremos aquí.<br/>
        <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6; text-decoration: none;">soporte@misautonomos.es</a>
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