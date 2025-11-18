import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 🔍 HELPER FUNCTION: Obtener estado completo de suscripción de un usuario
 * 
 * Devuelve información consolidada sobre:
 * - Si el usuario es profesional activo
 * - Qué plan tiene
 * - Si ya usó el trial
 * - Estado de visibilidad
 * 
 * Source of truth único para el frontend.
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Obtener suscripción activa
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            user_id: user.id
        });

        const subscription = subscriptions[0] || null;

        // Obtener perfil profesional si existe
        let professionalProfile = null;
        if (user.user_type === 'professionnel') {
            const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                user_id: user.id
            });
            professionalProfile = profiles[0] || null;
        }

        // Calcular estado
        const today = new Date();
        let status = {
            has_subscription: !!subscription,
            is_active: false,
            is_trial: false,
            is_canceled: false,
            is_visible: false,
            days_remaining: 0,
            plan_name: null,
            plan_price: null,
            renewal_date: null,
            has_used_trial: user.has_used_trial || false,
            first_trial_date: user.first_trial_date || null,
            profile_completed: professionalProfile?.onboarding_completed || false,
            profile_visible: professionalProfile?.visible_en_busqueda || false
        };

        if (subscription) {
            const expirationDate = new Date(subscription.fecha_expiracion);
            const daysRemaining = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
            const isStillInPeriod = expirationDate >= today;

            status.plan_name = subscription.plan_nombre;
            status.plan_price = subscription.plan_precio;
            status.renewal_date = subscription.fecha_expiracion;
            status.days_remaining = daysRemaining > 0 ? daysRemaining : 0;

            status.is_trial = subscription.estado === 'en_prueba';
            status.is_canceled = subscription.estado === 'cancelado';
            status.is_active = (
                (subscription.estado === 'activo' && isStillInPeriod) ||
                (subscription.estado === 'en_prueba' && isStillInPeriod) ||
                (subscription.estado === 'cancelado' && isStillInPeriod)
            );

            status.is_visible = status.is_active && professionalProfile?.visible_en_busqueda;
        }

        return Response.json({
            ok: true,
            user_id: user.id,
            email: user.email,
            user_type: user.user_type,
            status: status
        });

    } catch (error) {
        console.error('Error obteniendo estado:', error);
        return Response.json({ 
            ok: false,
            error: error.message 
        }, { status: 500 });
    }
});