import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// ✅ Esta función sincroniza el estado de suscripción con Stripe
// Se llama cuando el usuario accede a "Mi Suscripción" para asegurar datos actualizados

Deno.serve(async (req) => {
    console.log('🔄 ========== SINCRONIZAR CON STRIPE ==========');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('👤 Usuario:', user.email);

        // ✅ BUSCAR SUSCRIPCIÓN EN BD
        const dbSubs = await base44.asServiceRole.entities.Subscription.filter({
            user_id: user.id
        });

        if (dbSubs.length === 0) {
            console.log('ℹ️ No hay suscripción en BD');
            return Response.json({ 
                synced: true, 
                hasSubscription: false,
                message: 'No subscription found' 
            });
        }

        const dbSub = dbSubs[0];
        console.log('📊 Suscripción BD:', dbSub.estado, '- Stripe ID:', dbSub.stripe_subscription_id);

        // ✅ SI NO HAY ID DE STRIPE, BUSCAR POR EMAIL
        if (!dbSub.stripe_subscription_id) {
            console.log('⚠️ No hay stripe_subscription_id, buscando por email...');
            
            const customers = await stripe.customers.list({
                email: user.email,
                limit: 1
            });

            if (customers.data.length === 0) {
                console.log('❌ No hay cliente en Stripe');
                
                // Marcar como inactivo si la BD dice activo pero no hay nada en Stripe
                if (dbSub.estado === 'activo' || dbSub.estado === 'en_prueba') {
                    console.log('🔴 Corrigiendo: BD dice activo pero no hay suscripción en Stripe');
                    await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                        estado: 'finalizada',
                        renovacion_automatica: false
                    });

                    // Ocultar perfil
                    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: user.id });
                    if (profiles.length > 0) {
                        await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                            visible_en_busqueda: false,
                            estado_perfil: 'inactivo'
                        });
                    }

                    return Response.json({
                        synced: true,
                        corrected: true,
                        hasSubscription: false,
                        message: 'Subscription marked as inactive - no Stripe record found'
                    });
                }

                return Response.json({ 
                    synced: true, 
                    hasSubscription: false,
                    message: 'No Stripe customer found' 
                });
            }

            const customerId = customers.data[0].id;
            console.log('✅ Cliente Stripe encontrado:', customerId);

            // Buscar suscripciones del cliente
            const stripeSubs = await stripe.subscriptions.list({
                customer: customerId,
                limit: 10
            });

            if (stripeSubs.data.length === 0) {
                console.log('❌ Cliente existe pero no tiene suscripciones en Stripe');
                
                if (dbSub.estado === 'activo' || dbSub.estado === 'en_prueba') {
                    console.log('🔴 Corrigiendo: BD dice activo pero no hay suscripción en Stripe');
                    await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                        estado: 'finalizada',
                        renovacion_automatica: false,
                        stripe_customer_id: customerId
                    });

                    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: user.id });
                    if (profiles.length > 0) {
                        await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                            visible_en_busqueda: false,
                            estado_perfil: 'inactivo'
                        });
                    }

                    return Response.json({
                        synced: true,
                        corrected: true,
                        hasSubscription: false,
                        message: 'Subscription marked as inactive - customer has no subscriptions in Stripe'
                    });
                }

                return Response.json({ 
                    synced: true, 
                    hasSubscription: false,
                    stripeCustomerId: customerId 
                });
            }

            // Usar la suscripción más reciente
            const stripeSub = stripeSubs.data[0];
            console.log('✅ Suscripción Stripe encontrada:', stripeSub.id, '- Status:', stripeSub.status);

            // Actualizar BD con IDs de Stripe
            dbSub.stripe_subscription_id = stripeSub.id;
            dbSub.stripe_customer_id = customerId;
        }

        // ✅ OBTENER ESTADO ACTUAL DE STRIPE
        let stripeSub;
        try {
            stripeSub = await stripe.subscriptions.retrieve(dbSub.stripe_subscription_id);
            console.log('✅ Suscripción Stripe:', stripeSub.status);
        } catch (stripeErr) {
            console.error('❌ Suscripción no encontrada en Stripe:', stripeErr.message);
            
            // Si la suscripción no existe en Stripe, marcar como inactiva
            if (dbSub.estado === 'activo' || dbSub.estado === 'en_prueba') {
                console.log('🔴 Corrigiendo estado...');
                await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                    estado: 'finalizada',
                    renovacion_automatica: false
                });

                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: user.id });
                if (profiles.length > 0) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: false,
                        estado_perfil: 'inactivo'
                    });
                }
            }

            return Response.json({
                synced: true,
                corrected: true,
                hasSubscription: false,
                error: 'Stripe subscription not found'
            });
        }

        // ✅ CALCULAR ESTADO CORRECTO BASADO EN STRIPE
        let correctEstado;
        let correctVisible;
        
        if (stripeSub.status === 'active') {
            correctEstado = 'activo';
            correctVisible = true;
        } else if (stripeSub.status === 'trialing') {
            correctEstado = 'en_prueba';
            correctVisible = true;
        } else if (stripeSub.status === 'canceled') {
            // Cancelado pero puede seguir activo hasta fin de periodo
            const endDate = new Date(stripeSub.current_period_end * 1000);
            if (endDate > new Date()) {
                correctEstado = 'cancelado';
                correctVisible = true;
            } else {
                correctEstado = 'finalizada';
                correctVisible = false;
            }
        } else {
            correctEstado = 'finalizada';
            correctVisible = false;
        }

        console.log('📊 Estado correcto según Stripe:', correctEstado, '- Visible:', correctVisible);
        console.log('📊 Estado actual en BD:', dbSub.estado);

        // ✅ ACTUALIZAR SI HAY DIFERENCIAS
        const needsUpdate = dbSub.estado !== correctEstado;
        
        if (needsUpdate) {
            console.log('🔄 Actualizando BD para sincronizar con Stripe...');
            
            await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                estado: correctEstado,
                fecha_expiracion: new Date(stripeSub.current_period_end * 1000).toISOString(),
                renovacion_automatica: !stripeSub.cancel_at_period_end,
                stripe_subscription_id: stripeSub.id,
                stripe_customer_id: stripeSub.customer
            });

            // Actualizar perfil
            const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: user.id });
            if (profiles.length > 0) {
                await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                    visible_en_busqueda: correctVisible,
                    estado_perfil: correctVisible ? 'activo' : 'inactivo'
                });
            }

            // Actualizar usuario
            await base44.asServiceRole.entities.User.update(user.id, {
                subscription_status: correctEstado
            });

            console.log('✅ BD sincronizada con Stripe');
        }

        return Response.json({
            synced: true,
            corrected: needsUpdate,
            hasSubscription: true,
            stripeStatus: stripeSub.status,
            dbStatus: correctEstado,
            stripeSubscriptionId: stripeSub.id,
            stripeCustomerId: stripeSub.customer,
            visible: correctVisible,
            renewalDate: new Date(stripeSub.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});