import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// ✅ HELPER: Verificar si suscripción está activa
const isSubscriptionActive = (subscriptionStatus, endDate) => {
    const today = new Date();
    const expirationDate = new Date(endDate * 1000);
    
    const validStates = ["active", "trialing"];
    
    if (validStates.includes(subscriptionStatus)) {
        return expirationDate >= today;
    }
    
    if (subscriptionStatus === "canceled") {
        return expirationDate >= today;
    }
    
    return false;
};

Deno.serve(async (req) => {
    console.log('🔔 ========== WEBHOOK STRIPE ==========');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');
        
        if (!signature) {
            console.error('❌ Sin firma de Stripe');
            return Response.json({ error: 'Missing signature' }, { status: 400 });
        }

        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
            console.log('✅ Evento:', event.type);
        } catch (err) {
            console.error('❌ Error verificando firma:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // ✅ Calcular estado del perfil basado en suscripción Stripe
        const calculateProfileStatus = (subscriptionStatus, endDate) => {
            const isActive = isSubscriptionActive(subscriptionStatus, endDate);
            
            console.log('🔍 Estado Stripe:', {
                status: subscriptionStatus,
                endDate: new Date(endDate * 1000).toISOString(),
                isActive
            });
            
            // 🟢 Activo con pago
            if (subscriptionStatus === 'active') {
                return {
                    estado: 'activo',
                    visible: true,
                    perfil_estado: 'activo'
                };
            }
            
            // 🟡 En periodo de prueba
            if (subscriptionStatus === 'trialing') {
                return {
                    estado: 'en_prueba',
                    visible: true,
                    perfil_estado: 'activo'
                };
            }
            
            // ⚪ Cancelado pero aún con tiempo
            if (subscriptionStatus === 'canceled' && isActive) {
                return {
                    estado: 'cancelado',
                    visible: true, // ✅ MANTENER VISIBLE hasta que expire
                    perfil_estado: 'activo'
                };
            }
            
            // 🔴 Expirado o cancelado sin tiempo
            return {
                estado: 'finalizada',
                visible: false,
                perfil_estado: 'inactivo'
            };
        };

        switch (event.type) {
            case 'checkout.session.completed': {
                console.log('\n🎉 CHECKOUT COMPLETADO');
                
                const session = event.data.object;
                const userId = session.metadata?.user_id;
                const planId = session.metadata?.plan_id;
                const isTrial = session.metadata?.is_trial === 'true';
                
                if (!userId || !planId) {
                    console.error('❌ Sin metadata');
                    return Response.json({ received: true });
                }

                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                
                console.log('📊 Suscripción Stripe:', {
                    id: subscription.id,
                    status: subscription.status,
                    trial: isTrial
                });

                // ✅ CRÍTICO: Marcar trial como usado SOLO cuando se confirma el pago
                if (isTrial) {
                    console.log('🎁 Marcando trial como usado para user:', userId);
                    await base44.asServiceRole.entities.User.update(userId, {
                        free_trial_used: true
                    });
                    console.log('✅ free_trial_used = true guardado');
                }

                const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
                    plan_id: planId
                });
                
                if (!plans[0]) {
                    console.error('❌ Plan no encontrado');
                    return Response.json({ received: true });
                }

                const plan = plans[0];
                const profileStatus = calculateProfileStatus(
                    subscription.status,
                    subscription.current_period_end
                );

                // Buscar suscripción existente
                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                    user_id: userId
                });

                const subData = {
                    user_id: userId,
                    plan_id: planId,
                    plan_nombre: plan.nombre,
                    plan_precio: plan.precio,
                    fecha_inicio: new Date(subscription.current_period_start * 1000).toISOString(),
                    fecha_expiracion: new Date(subscription.current_period_end * 1000).toISOString(),
                    estado: profileStatus.estado,
                    renovacion_automatica: !subscription.cancel_at_period_end,
                    metodo_pago: 'stripe',
                    stripe_subscription_id: subscription.id,
                    stripe_customer_id: subscription.customer
                };

                if (existingSubs[0]) {
                    await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subData);
                    console.log('✅ Suscripción actualizada');
                } else {
                    await base44.asServiceRole.entities.Subscription.create(subData);
                    console.log('✅ Suscripción creada');
                }

                // Actualizar usuario
                await base44.asServiceRole.entities.User.update(userId, {
                    user_type: 'professionnel',
                    subscription_status: profileStatus.estado
                });

                // Actualizar perfil si existe
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: userId
                });

                if (profiles[0]) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: profileStatus.visible,
                        estado_perfil: profileStatus.perfil_estado
                    });
                    console.log(`✅ Perfil actualizado - Visible: ${profileStatus.visible}`);
                }

                console.log('✅ Checkout procesado');
                break;
            }

            case 'customer.subscription.updated': {
                console.log('\n🔄 SUSCRIPCIÓN ACTUALIZADA');
                
                const subscription = event.data.object;
                
                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length === 0) {
                    console.log('⚠️ Suscripción no encontrada en BD');
                    return Response.json({ received: true });
                }

                const dbSub = subs[0];
                const profileStatus = calculateProfileStatus(
                    subscription.status,
                    subscription.current_period_end
                );

                // Actualizar suscripción
                await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                    estado: profileStatus.estado,
                    fecha_expiracion: new Date(subscription.current_period_end * 1000).toISOString(),
                    renovacion_automatica: !subscription.cancel_at_period_end
                });

                // Actualizar perfil
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: dbSub.user_id
                });

                if (profiles[0]) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: profileStatus.visible,
                        estado_perfil: profileStatus.perfil_estado
                    });
                    console.log(`✅ Visibilidad: ${profileStatus.visible}`);
                }

                // Actualizar usuario
                await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                    subscription_status: profileStatus.estado
                });

                console.log('✅ Suscripción actualizada');
                break;
            }

            case 'customer.subscription.deleted': {
                console.log('\n🔴 SUSCRIPCIÓN ELIMINADA');
                
                const subscription = event.data.object;
                
                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length === 0) {
                    console.log('⚠️ Suscripción no encontrada');
                    return Response.json({ received: true });
                }

                const dbSub = subs[0];
                
                // Marcar como finalizada
                await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                    estado: 'finalizada',
                    renovacion_automatica: false
                });

                // Ocultar perfil
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: dbSub.user_id
                });

                if (profiles[0]) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: false,
                        estado_perfil: 'inactivo'
                    });
                    console.log('❌ Perfil ocultado');
                }

                // Actualizar usuario
                await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                    subscription_status: 'finalizada'
                });

                console.log('✅ Suscripción finalizada');
                break;
            }

            default:
                console.log('ℹ️ Evento no manejado:', event.type);
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});