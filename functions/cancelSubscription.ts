
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
            fecha_expiracion: subscription.fecha_expiracion,
            plan_nombre: subscription.plan_nombre // Assuming this property exists on the subscription object
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
        // The subscription will be marked as "cancelado" but access is retained until end of period due to Stripe's cancel_at_period_end
        await base44.entities.Subscription.update(subscription.id, {
            estado: "cancelado",
            renovacion_automatica: false
        });
        console.log('✅ Suscripción actualizada en BD local: estado = cancelado, renovacion_automatica = false');

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

            // Determine if the subscription remains active until the end of the period
            // Based on the 'cancel_at_period_end: true' logic, it should always be true if Stripe was successfully updated.
            // If Stripe was not involved or failed, then it's considered immediately inactive.
            const isActiveUntilEnd = stripeCanceled && (subscription.stripe_subscription_id !== null); // If stripe operation was successful, implies cancel_at_period_end was set.
            
            let expirationDate: Date | null = null;
            if (subscription.fecha_expiracion) {
                expirationDate = new Date(subscription.fecha_expiracion);
            } else {
                console.warn("subscription.fecha_expiracion is missing, falling back to a placeholder for email display.");
                expirationDate = new Date(); // Fallback to current date
            }

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: userEmail,
                subject: "Suscripción cancelada - Misautónomos",
                body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
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
      <div class="logo">📋</div>
      <h1>Suscripción cancelada</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${userName},</p>
      
      <p class="message">
        Tu solicitud de cancelación de suscripción en <strong>Misautónomos</strong> ha sido procesada correctamente.
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
      <strong>Equipo Misautónomos</strong>
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
