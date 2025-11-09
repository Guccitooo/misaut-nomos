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
            await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: "Suscripción cancelada - milautonomos",
                body: `Hola ${user.full_name || user.email},

Tu suscripción a milautonomos ha sido cancelada correctamente.

✅ Detalles de la cancelación:
- Fecha de cancelación: ${new Date().toLocaleDateString('es-ES')}
- Tu perfil seguirá activo hasta: ${new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}
- Después de esa fecha, tu perfil dejará de aparecer en las búsquedas

⚠️ IMPORTANTE: 
Tu perfil ya ha sido ocultado de las búsquedas públicas.
No recibirás nuevos contactos de clientes.
Podrás seguir accediendo a tu cuenta hasta la fecha de expiración.

💡 Si cambias de opinión:
Puedes reactivar tu suscripción en cualquier momento desde tu panel de usuario.

¿Necesitas ayuda? Responde a este email o contacta con soporte@milautonomos.com

Gracias por haber formado parte de milautonomos.

Equipo milautonomos`,
                from_name: "milautonomos"
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