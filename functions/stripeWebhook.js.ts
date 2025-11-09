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
                
                if (!userId || !planId) {
                    console.error('❌ Sin metadata');
                    return Response.json({ received: true });
                }

                const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
                
                console.log('📊 Stripe:', {
                    status: stripeSubscription.status,
                    trial: isTrial,
                    end: new Date(stripeSubscription.current_period_end * 1000).toISOString()
                });

                // ✅ Marcar trial como usado
                if (isTrial) {
                    console.log('🎁 Marcando trial usado');
                    await base44.asServiceRole.entities.User.update(userId, {
                        free_trial_used: true
                    });
                }

                // Cargar plan
                const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
                    plan_id: planId
                });
                
                if (!plans[0]) {
                    console.error('❌ Plan no encontrado');
                    return Response.json({ received: true });
                }

                // ✅ CRÍTICO: Estado según Stripe
                let estado;
                if (stripeSubscription.status === 'trialing') {
                    estado = 'en_prueba';
                } else if (stripeSubscription.status === 'active') {
                    estado = 'activo';
                } else {
                    estado = 'pendiente';
                }

                console.log('💾 Estado a guardar:', estado);

                // Guardar suscripción
                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                    user_id: userId
                });

                const subData = {
                    user_id: userId,
                    plan_id: planId,
                    plan_nombre: plans[0].nombre,
                    plan_precio: plans[0].precio,
                    fecha_inicio: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
                    fecha_expiracion: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                    estado: estado,
                    renovacion_automatica: !stripeSubscription.cancel_at_period_end,
                    metodo_pago: 'stripe',
                    stripe_subscription_id: stripeSubscription.id,
                    stripe_customer_id: stripeSubscription.customer
                };

                if (existingSubs[0]) {
                    await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subData);
                } else {
                    await base44.asServiceRole.entities.Subscription.create(subData);
                }

                // Actualizar usuario
                await base44.asServiceRole.entities.User.update(userId, {
                    user_type: 'professionnel',
                    subscription_status: estado
                });

                // ✅ CRÍTICO: Actualizar perfil - SIEMPRE visible si tiene fecha futura
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: userId
                });

                if (profiles[0]) {
                    console.log('🔄 Actualizando perfil → VISIBLE');
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: true, // ✅ VISIBLE cuando hay suscripción
                        estado_perfil: 'activo'
                    });
                    console.log('✅ Perfil actualizado a VISIBLE');
                }

                console.log('✅ Checkout procesado');
                break;
            }

            case 'customer.subscription.updated': {
                console.log('\n🔄 ========== SUSCRIPCIÓN ACTUALIZADA ==========');
                
                const stripeSubscription = event.data.object;
                
                console.log('📊 Stripe:', {
                    status: stripeSubscription.status,
                    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                    current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString()
                });

                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: stripeSubscription.id
                });

                if (subs.length === 0) {
                    console.log('⚠️ Suscripción no encontrada');
                    return Response.json({ received: true });
                }

                const dbSub = subs[0];
                const expirationDate = new Date(stripeSubscription.current_period_end * 1000);
                const today = new Date();
                const daysLeft = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
                
                console.log('📅 Días restantes:', daysLeft);

                // ✅ LÓGICA CORREGIDA
                let estado, visible, perfilEstado;

                if (stripeSubscription.status === 'canceled') {
                    // ✅ CRÍTICO: Si canceló pero tiene días → MANTENER VISIBLE
                    if (daysLeft > 0) {
                        estado = 'cancelado';
                        visible = true; // ✅ VISIBLE hasta expiración
                        perfilEstado = 'activo';
                        console.log(`⚪ CANCELADO con ${daysLeft} días → VISIBLE hasta ${expirationDate.toLocaleDateString()}`);
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

                // Actualizar BD
                await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                    estado: estado,
                    fecha_expiracion: expirationDate.toISOString(),
                    renovacion_automatica: !stripeSubscription.cancel_at_period_end
                });

                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: dbSub.user_id
                });

                if (profiles[0]) {
                    console.log(`🔄 Actualizando perfil → visible: ${visible}`);
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: visible,
                        estado_perfil: perfilEstado
                    });
                    console.log('✅ Perfil actualizado en BD');
                }

                await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                    subscription_status: estado
                });

                console.log('✅ Actualización completada');
                break;
            }

            case 'customer.subscription.deleted': {
                console.log('\n🔴 ========== SUSCRIPCIÓN ELIMINADA ==========');
                
                const stripeSubscription = event.data.object;
                
                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: stripeSubscription.id
                });

                if (subs.length === 0) {
                    return Response.json({ received: true });
                }

                const dbSub = subs[0];
                
                // ✅ OCULTAR perfil cuando Stripe elimina la suscripción
                await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                    estado: 'finalizada',
                    renovacion_automatica: false
                });

                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: dbSub.user_id
                });

                if (profiles[0]) {
                    console.log('🔄 Ocultando perfil');
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: false,
                        estado_perfil: 'inactivo'
                    });
                    console.log('❌ Perfil ocultado');
                }

                await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                    subscription_status: 'finalizada'
                });

                console.log('✅ Suscripción eliminada');
                break;
            }

            default:
                console.log('ℹ️ Evento ignorado:', event.type);
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});