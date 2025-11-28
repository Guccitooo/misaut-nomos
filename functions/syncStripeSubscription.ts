import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * Sincroniza la suscripción del usuario con Stripe
 * - Busca la suscripción activa en Stripe por email
 * - Crea/actualiza la suscripción en la BD
 * - Actualiza el perfil y usuario
 */

Deno.serve(async (req) => {
    console.log('🔄 ========== SYNC STRIPE SUBSCRIPTION ==========');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        console.log('👤 Usuario:', user.email, '- ID:', user.id);

        // Obtener body si existe
        let sessionId = null;
        try {
            const body = await req.json();
            sessionId = body.sessionId;
        } catch (e) {
            // No hay body, está bien
        }

        // ✅ BUSCAR CLIENTE EN STRIPE
        let stripeCustomer = null;
        let stripeSubscription = null;

        // 1. Buscar cliente por email
        const customers = await stripe.customers.list({
            email: user.email,
            limit: 1
        });

        if (customers.data.length > 0) {
            stripeCustomer = customers.data[0];
            console.log('✅ Cliente Stripe encontrado:', stripeCustomer.id);

            // 2. Buscar suscripciones activas del cliente
            const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomer.id,
                status: 'all',
                limit: 5
            });

            console.log('📊 Suscripciones en Stripe:', subscriptions.data.length);

            // Filtrar suscripciones activas o en trial
            const activeOrTrialing = subscriptions.data.filter(sub => 
                sub.status === 'active' || sub.status === 'trialing'
            );

            if (activeOrTrialing.length > 0) {
                stripeSubscription = activeOrTrialing[0];
                console.log('✅ Suscripción activa encontrada:', stripeSubscription.id, '- Status:', stripeSubscription.status);
            } else if (subscriptions.data.length > 0) {
                // Tomar la más reciente aunque no esté activa
                stripeSubscription = subscriptions.data[0];
                console.log('⚠️ Suscripción más reciente:', stripeSubscription.id, '- Status:', stripeSubscription.status);
            }
        } else {
            console.log('⚠️ No se encontró cliente en Stripe para:', user.email);
        }

        // ✅ SI NO HAY SUSCRIPCIÓN EN STRIPE, VERIFICAR EN BD
        if (!stripeSubscription) {
            const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
            
            if (existingSubs.length > 0) {
                const sub = existingSubs[0];
                return Response.json({
                    ok: true,
                    source: 'database',
                    subscription: {
                        id: sub.id,
                        status: sub.estado,
                        active: ['activo', 'en_prueba', 'trialing', 'active'].includes(sub.estado?.toLowerCase()),
                        expiration: sub.fecha_expiracion
                    },
                    message: 'Suscripción encontrada en BD (no en Stripe)'
                });
            }

            return Response.json({
                ok: false,
                subscription: null,
                message: 'No se encontró suscripción en Stripe ni en BD'
            });
        }

        // ✅ CALCULAR ESTADO
        const isActive = stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing';
        const estado = stripeSubscription.status === 'trialing' ? 'en_prueba' : 
                       stripeSubscription.status === 'active' ? 'activo' :
                       stripeSubscription.status === 'canceled' ? 'cancelado' : 'finalizada';

        // ✅ OBTENER PLAN
        const planId = stripeSubscription.metadata?.plan_id || 'plan_monthly_trial';
        const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: planId });
        const plan = plans[0] || { nombre: 'Plan Mensual', precio: 33 };

        // ✅ CREAR/ACTUALIZAR SUSCRIPCIÓN EN BD
        const subscriptionData = {
            user_id: user.id,
            plan_id: planId,
            plan_nombre: plan.nombre,
            plan_precio: plan.precio,
            fecha_inicio: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            fecha_expiracion: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            estado: estado,
            renovacion_automatica: !stripeSubscription.cancel_at_period_end,
            metodo_pago: 'stripe',
            stripe_subscription_id: stripeSubscription.id,
            stripe_customer_id: stripeCustomer.id
        };

        const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
        
        let subscriptionId;
        if (existingSubs.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subscriptionData);
            subscriptionId = existingSubs[0].id;
            console.log('✅ Suscripción actualizada en BD:', subscriptionId);
        } else {
            const newSub = await base44.asServiceRole.entities.Subscription.create(subscriptionData);
            subscriptionId = newSub.id;
            console.log('✅ Suscripción creada en BD:', subscriptionId);
        }

        // ✅ ACTUALIZAR USUARIO
        const userUpdateData = {
            user_type: 'professionnel',
            subscription_status: estado,
            subscription_start_date: new Date(stripeSubscription.current_period_start * 1000).toISOString().split('T')[0],
            subscription_end_date: new Date(stripeSubscription.current_period_end * 1000).toISOString().split('T')[0]
        };

        if (stripeSubscription.status === 'trialing') {
            userUpdateData.has_used_trial = true;
        }

        await base44.asServiceRole.entities.User.update(user.id, userUpdateData);
        console.log('✅ Usuario actualizado');

        // ✅ ACTUALIZAR PERFIL SI EXISTE Y ONBOARDING COMPLETADO
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: user.id });
        
        let profileVisible = false;
        if (profiles.length > 0) {
            const profile = profiles[0];
            const shouldBeVisible = profile.onboarding_completed === true && isActive;
            
            await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                visible_en_busqueda: shouldBeVisible,
                estado_perfil: isActive ? 'activo' : 'inactivo'
            });
            
            profileVisible = shouldBeVisible;
            console.log('✅ Perfil actualizado - Visible:', shouldBeVisible);
        }

        console.log('✅ ========== SYNC COMPLETADO ==========');

        return Response.json({
            ok: true,
            source: 'stripe',
            subscription: {
                id: subscriptionId,
                stripe_id: stripeSubscription.id,
                status: estado,
                active: isActive,
                expiration: subscriptionData.fecha_expiracion,
                trial: stripeSubscription.status === 'trialing'
            },
            profile: {
                exists: profiles.length > 0,
                visible: profileVisible,
                onboarding_completed: profiles.length > 0 ? profiles[0].onboarding_completed : false
            },
            message: 'Suscripción sincronizada correctamente'
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('❌ Stack:', error.stack);
        return Response.json({ 
            ok: false,
            error: error.message 
        }, { status: 500 });
    }
});