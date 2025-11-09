import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    console.log('🔔 ========== WEBHOOK STRIPE ==========');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');
        
        if (!signature) {
            return Response.json({ error: 'Missing signature' }, { status: 400 });
        }

        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
            console.log('✅ Evento:', event.type);
        } catch (err) {
            console.error('❌ Firma inválida:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                console.log('\n🎉 ========== CHECKOUT COMPLETADO ==========');
                
                const session = event.data.object;
                const userId = session.metadata?.user_id;
                const planId = session.metadata?.plan_id;
                const isTrial = session.metadata?.is_trial === 'true';
                
                console.log('📊 Metadata:', { userId, planId, isTrial });
                
                if (!userId || !planId) {
                    console.error('❌ Sin metadata requerido');
                    return Response.json({ received: true });
                }

                // Recuperar suscripción de Stripe
                const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
                
                console.log('📊 Stripe subscription:', {
                    id: stripeSubscription.id,
                    status: stripeSubscription.status,
                    current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString()
                });

                // ✅ CRÍTICO: Marcar trial como usado
                if (isTrial) {
                    console.log('🎁 Marcando free_trial_used = true para user:', userId);
                    try {
                        await base44.asServiceRole.entities.User.update(userId, {
                            free_trial_used: true
                        });
                        console.log('✅ free_trial_used guardado en BD');
                    } catch (error) {
                        console.error('❌ ERROR guardando free_trial_used:', error);
                    }
                }

                // Cargar plan
                const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
                    plan_id: planId
                });
                
                if (!plans[0]) {
                    console.error('❌ Plan no encontrado:', planId);
                    return Response.json({ received: true });
                }

                const plan = plans[0];

                // ✅ Calcular estado según Stripe
                let estado, visible, perfilEstado;
                
                if (stripeSubscription.status === 'trialing') {
                    estado = 'en_prueba';
                    visible = true;
                    perfilEstado = 'activo';
                    console.log('🟡 Estado: EN PRUEBA → Visible');
                } else if (stripeSubscription.status === 'active') {
                    estado = 'activo';
                    visible = true;
                    perfilEstado = 'activo';
                    console.log('🟢 Estado: ACTIVO → Visible');
                } else {
                    estado = 'pendiente';
                    visible = false;
                    perfilEstado = 'pendiente';
                    console.log('⚪ Estado: PENDIENTE → Oculto');
                }

                // Guardar/actualizar suscripción
                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                    user_id: userId
                });

                const subData = {
                    user_id: userId,
                    plan_id: planId,
                    plan_nombre: plan.nombre,
                    plan_precio: plan.precio,
                    fecha_inicio: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
                    fecha_expiracion: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                    estado: estado,
                    renovacion_automatica: !stripeSubscription.cancel_at_period_end,
                    metodo_pago: 'stripe',
                    stripe_subscription_id: stripeSubscription.id,
                    stripe_customer_id: stripeSubscription.customer
                };

                console.log('💾 Guardando suscripción:', subData);

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
                    subscription_status: estado
                });
                console.log('✅ Usuario actualizado');

                // Actualizar perfil si existe
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: userId
                });

                if (profiles[0]) {
                    console.log('🔄 Actualizando perfil - visible:', visible);
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: visible,
                        estado_perfil: perfilEstado
                    });
                    console.log('✅ Perfil actualizado');
                } else {
                    console.log('ℹ️ Perfil no existe aún (se creará en onboarding)');
                }

                console.log('✅ ========== CHECKOUT PROCESADO ==========');
                break;
            }

            case 'customer.subscription.updated': {
                console.log('\n🔄 ========== SUSCRIPCIÓN ACTUALIZADA ==========');
                
                const stripeSubscription = event.data.object;
                
                console.log('📊 Stripe status:', stripeSubscription.status);
                console.log('📊 Cancel at period end:', stripeSubscription.cancel_at_period_end);
                console.log('📊 Current period end:', new Date(stripeSubscription.current_period_end * 1000).toISOString());

                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: stripeSubscription.id
                });

                if (subs.length === 0) {
                    console.log('⚠️ Suscripción no encontrada en BD');
                    return Response.json({ received: true });
                }

                const dbSub = subs[0];
                const today = new Date();
                const expirationDate = new Date(stripeSubscription.current_period_end * 1000);
                const daysLeft = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

                console.log('📅 Días restantes:', daysLeft);

                // ✅ LÓGICA CLARA Y SIMPLE
                let estado, visible, perfilEstado;

                if (stripeSubscription.status === 'canceled') {
                    // Si canceló pero aún tiene días → MANTENER VISIBLE
                    if (daysLeft > 0) {
                        estado = 'cancelado';
                        visible = true; // ✅ VISIBLE hasta que expire
                        perfilEstado = 'activo';
                        console.log('⚪ CANCELADO pero con días → VISIBLE');
                    } else {
                        estado = 'finalizada';
                        visible = false;
                        perfilEstado = 'inactivo';
                        console.log('🔴 CANCELADO sin días → OCULTO');
                    }
                } else if (stripeSubscription.status === 'trialing') {
                    estado = 'en_prueba';
                    visible = true;
                    perfilEstado = 'activo';
                    console.log('🟡 EN PRUEBA → VISIBLE');
                } else if (stripeSubscription.status === 'active') {
                    estado = 'activo';
                    visible = true;
                    perfilEstado = 'activo';
                    console.log('🟢 ACTIVO → VISIBLE');
                } else {
                    estado = 'finalizada';
                    visible = false;
                    perfilEstado = 'inactivo';
                    console.log('🔴 OTRO ESTADO → OCULTO');
                }

                // Actualizar suscripción
                await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                    estado: estado,
                    fecha_expiracion: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                    renovacion_automatica: !stripeSubscription.cancel_at_period_end
                });
                console.log('✅ Suscripción BD actualizada');

                // Actualizar perfil
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: dbSub.user_id
                });

                if (profiles[0]) {
                    console.log('🔄 Actualizando perfil - visible:', visible, '- estado:', perfilEstado);
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: visible,
                        estado_perfil: perfilEstado
                    });
                    console.log('✅ Perfil BD actualizado');
                }

                // Actualizar usuario
                await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                    subscription_status: estado
                });
                console.log('✅ Usuario BD actualizado');

                console.log('✅ ========== ACTUALIZACIÓN COMPLETADA ==========');
                break;
            }

            case 'customer.subscription.deleted': {
                console.log('\n🔴 ========== SUSCRIPCIÓN ELIMINADA ==========');
                
                const stripeSubscription = event.data.object;
                
                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: stripeSubscription.id
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

                await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                    subscription_status: 'finalizada'
                });

                console.log('✅ Suscripción eliminada completamente');
                break;
            }

            default:
                console.log('ℹ️ Evento ignorado:', event.type);
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('Stack:', error.stack);
        return Response.json({ error: error.message }, { status: 500 });
    }
});