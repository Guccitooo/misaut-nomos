import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * ✅ FUNCIÓN DE SINCRONIZACIÓN FORZADA
 * 
 * Busca activamente en Stripe la suscripción de un usuario
 * y la sincroniza con la base de datos.
 * 
 * Útil cuando el webhook no llega o tarda demasiado.
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticación
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                ok: false, 
                error: 'No autenticado' 
            }, { status: 401 });
        }

        console.log('🔄 ========== SINCRONIZACIÓN FORZADA INICIADA ==========');
        console.log('👤 Usuario:', user.email);

        // 1️⃣ Buscar cliente en Stripe por email
        console.log('🔍 Buscando cliente en Stripe...');
        const customers = await stripe.customers.list({
            email: user.email,
            limit: 1
        });

        if (customers.data.length === 0) {
            console.log('❌ No se encontró cliente en Stripe');
            return Response.json({
                ok: false,
                error: 'no_stripe_customer',
                message: 'No se encontró una cuenta de Stripe asociada a este email'
            });
        }

        const customer = customers.data[0];
        console.log('✅ Cliente encontrado:', customer.id);

        // 2️⃣ Buscar suscripciones activas del cliente
        console.log('🔍 Buscando suscripciones...');
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'all',
            limit: 10
        });

        console.log(`📊 Suscripciones encontradas: ${subscriptions.data.length}`);

        if (subscriptions.data.length === 0) {
            console.log('❌ No se encontraron suscripciones');
            return Response.json({
                ok: false,
                error: 'no_subscription',
                message: 'No se encontró ninguna suscripción en Stripe'
            });
        }

        // Obtener la suscripción más reciente que esté activa o en trial
        const activeSubscription = subscriptions.data.find(sub => 
            sub.status === 'active' || sub.status === 'trialing'
        ) || subscriptions.data[0];

        console.log('✅ Suscripción seleccionada:', {
            id: activeSubscription.id,
            status: activeSubscription.status,
            current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString()
        });

        // 3️⃣ Determinar estado normalizado
        let estado;
        if (activeSubscription.status === 'trialing') {
            estado = 'en_prueba';
        } else if (activeSubscription.status === 'active') {
            estado = 'activo';
        } else if (activeSubscription.status === 'canceled') {
            estado = 'cancelado';
        } else {
            estado = 'finalizada';
        }

        console.log('📋 Estado determinado:', estado);

        // 4️⃣ Buscar o determinar plan
        let planId = 'plan_monthly_trial';
        let planNombre = 'Mensual (7 días gratis)';
        let planPrecio = 49;

        // Intentar obtener info del plan desde items
        if (activeSubscription.items.data.length > 0) {
            const item = activeSubscription.items.data[0];
            const price = item.price;
            
            if (price.recurring) {
                if (price.recurring.interval === 'month' && price.recurring.interval_count === 3) {
                    planId = 'plan_quarterly';
                    planNombre = 'Trimestral';
                    planPrecio = 120;
                } else if (price.recurring.interval === 'year') {
                    planId = 'plan_annual';
                    planNombre = 'Anual';
                    planPrecio = 450;
                }
            }
            
            console.log('💼 Plan detectado:', planId);
        }

        // 5️⃣ Buscar suscripción existente en BD
        const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
            user_id: user.id
        });

        const subscriptionData = {
            user_id: user.id,
            plan_id: planId,
            plan_nombre: planNombre,
            plan_precio: planPrecio,
            fecha_inicio: new Date(activeSubscription.current_period_start * 1000).toISOString(),
            fecha_expiracion: new Date(activeSubscription.current_period_end * 1000).toISOString(),
            estado: estado,
            renovacion_automatica: activeSubscription.cancel_at_period_end === false,
            metodo_pago: 'stripe',
            stripe_subscription_id: activeSubscription.id,
            stripe_customer_id: customer.id
        };

        console.log('💾 Datos a guardar:', subscriptionData);

        // 6️⃣ Crear o actualizar suscripción
        if (existingSubs.length > 0) {
            console.log('🔄 Actualizando suscripción existente...');
            await base44.asServiceRole.entities.Subscription.update(
                existingSubs[0].id,
                subscriptionData
            );
        } else {
            console.log('➕ Creando nueva suscripción...');
            await base44.asServiceRole.entities.Subscription.create(subscriptionData);
        }

        console.log('✅ Suscripción sincronizada en BD');

        // 7️⃣ Actualizar estado del usuario
        await base44.asServiceRole.entities.User.update(user.id, {
            user_type: 'professionnel',
            subscription_status: estado
        });

        console.log('✅ Usuario actualizado');

        // 8️⃣ Buscar y actualizar perfil profesional si existe
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: user.id
        });

        if (profiles.length > 0) {
            const isActive = estado === 'activo' || estado === 'en_prueba';
            
            await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                visible_en_busqueda: isActive,
                estado_perfil: isActive ? 'activo' : 'inactivo'
            });
            
            console.log(`✅ Perfil profesional actualizado - Visible: ${isActive}`);
        } else {
            console.log('ℹ️ Perfil profesional aún no existe');
        }

        console.log('✅ ========== SINCRONIZACIÓN COMPLETADA ==========');

        return Response.json({
            ok: true,
            message: 'Suscripción sincronizada correctamente',
            subscription: {
                estado: estado,
                plan: planNombre,
                fecha_expiracion: subscriptionData.fecha_expiracion,
                stripe_subscription_id: activeSubscription.id
            },
            needs_onboarding: profiles.length === 0
        });

    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        return Response.json({
            ok: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});