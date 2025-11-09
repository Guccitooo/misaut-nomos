
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// ✅ HELPER: Verificar si suscripción está activa (fuente única de verdad)
const isSubscriptionActive = (subscriptionStatus, endDate) => {
    const today = new Date();
    const expirationDate = new Date(endDate * 1000);
    
    const validStates = ["active", "trialing"];
    
    // Si está en un estado válido y no ha expirado
    if (validStates.includes(subscriptionStatus)) {
        return expirationDate >= today;
    }
    
    // Si está cancelado pero aún tiene tiempo
    if (subscriptionStatus === "canceled") {
        return expirationDate >= today;
    }
    
    return false;
};

Deno.serve(async (req) => {
    console.log('🔔 ========== WEBHOOK STRIPE RECIBIDO ==========');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');
        
        console.log('📝 Body length:', body.length);
        console.log('🔏 Signature present:', !!signature);
        
        if (!signature) {
            console.error('❌ Sin firma de Stripe');
            return Response.json({ error: 'Missing signature' }, { status: 400 });
        }

        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                webhookSecret
            );
            console.log('✅ Evento verificado:', event.type);
            console.log('🆔 Event ID:', event.id);
        } catch (err) {
            console.error('❌ Error verificando firma:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // ✅ FUNCIÓN HELPER: Calcular estado del perfil
        const calculateProfileStatus = (subscriptionStatus, endDate) => {
            console.log('🔍 Calculando estado:', {
                subscriptionStatus,
                endDate: new Date(endDate * 1000).toISOString(),
                isActive: isSubscriptionActive(subscriptionStatus, endDate)
            });
            
            // 🟢 Activo con pago
            if (subscriptionStatus === 'active') {
                return {
                    estado: 'activo',
                    visible_en_busqueda: true,
                    estado_perfil: 'activo',
                    mensaje: 'Suscripción activa'
                };
            }
            
            // 🟡 En periodo de prueba
            if (subscriptionStatus === 'trialing') {
                return {
                    estado: 'en_prueba',
                    visible_en_busqueda: true,
                    estado_perfil: 'activo',
                    mensaje: 'Periodo de prueba activo'
                };
            }
            
            // ⚪ Cancelado pero con tiempo restante
            if (subscriptionStatus === 'canceled' && isSubscriptionActive(subscriptionStatus, endDate)) {
                return {
                    estado: 'cancelado',
                    visible_en_busqueda: true,
                    estado_perfil: 'activo',
                    mensaje: 'Cancelado - activo hasta fin de periodo'
                };
            }
            
            // 🔴 Expirado
            return {
                estado: 'finalizada',
                visible_en_busqueda: false,
                estado_perfil: 'inactivo',
                mensaje: 'Suscripción finalizada'
            };
        };

        // ✅ MANEJAR TODOS LOS EVENTOS DE STRIPE
        switch (event.type) {
            case 'customer.subscription.created':
            case 'checkout.session.completed': {
                console.log('\n🎉 ========== NUEVA SUSCRIPCIÓN ==========');
                
                let actualStripeSubscription; // This will hold the actual Stripe Subscription object
                let eventMetadata;            // This will hold metadata specific to the event (session.metadata or subscription.metadata)
                let actualEmail;              // This will hold the user's email
                let actualPlanId;             // This will hold the planId from metadata
                let actualUserId;             // This will hold the userId (from session metadata or by finding/creating user)
                let subscriptionPlan;         // This will hold the base44 SubscriptionPlan object

                if (event.type === 'checkout.session.completed') {
                    const session = event.data.object;
                    console.log('💳 Checkout session completed:', session.id);

                    actualUserId = session.metadata?.user_id; // Use this for user lookup/creation
                    actualPlanId = session.metadata?.plan_id;
                    const isTrial = session.metadata?.is_trial === 'true';

                    if (!actualUserId || !actualPlanId) {
                        console.error('❌ Missing user_id or plan_id in session metadata for checkout.session.completed');
                        return Response.json({ error: 'Missing metadata', received: true }, { status: 400 });
                    }

                    actualStripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
                    eventMetadata = session.metadata || {}; // Metadata from the session
                    actualEmail = eventMetadata.user_email || session.customer_email; // Changed from eventMetadata.email to eventMetadata.user_email
                    
                    console.log('📧 Email del usuario (session):', actualEmail);
                    console.log('📊 Metadata completo (session):', JSON.stringify(eventMetadata, null, 2));
                    console.log('📊 Status Stripe (retrieved subscription):', actualStripeSubscription.status);
                    console.log('🎁 Is Trial:', isTrial); // Added log

                    // ✅ CRÍTICO: Marcar trial como usado INMEDIATAMENTE cuando se crea la sesión
                    if (isTrial) {
                        console.log('🎁 [TRIAL] Marcando periodo gratuito como USADO para user:', actualUserId);
                        try {
                            // ✅ CORREGIDO: Usar el método correcto para actualizar usuario
                            await base44.asServiceRole.entities.User.update(actualUserId, {
                                free_trial_used: true
                            });
                            console.log('✅ [TRIAL] Campo free_trial_used = true GUARDADO en BD');
                            
                            // Verificar que se guardó correctamente
                            const updatedUsers = await base44.asServiceRole.entities.User.filter({ id: actualUserId });
                            if (updatedUsers[0]) {
                                console.log('🔍 [TRIAL VERIFY] free_trial_used en BD:', updatedUsers[0].free_trial_used);
                            }
                        } catch (error) {
                            console.error('❌ [TRIAL] Error CRÍTICO actualizando free_trial_used:', error);
                            console.error('❌ [TRIAL] Stack:', error.stack);
                        }
                    }

                    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
                        plan_id: actualPlanId
                    });
                    subscriptionPlan = plans[0];

                    if (!subscriptionPlan) {
                        console.error('❌ Plan not found for checkout.session.completed:', actualPlanId);
                        return Response.json({ error: 'Plan not found from session', received: true }, { status: 404 });
                    }

                } else { // customer.subscription.created
                    actualStripeSubscription = event.data.object; // For this event, data.object IS the subscription
                    eventMetadata = actualStripeSubscription.metadata || {};
                    actualEmail = eventMetadata.email || actualStripeSubscription.customer_email;
                    actualPlanId = eventMetadata.plan_id || 'plan_monthly_trial'; // Changed from planId to plan_id
                    actualUserId = eventMetadata.user_id; // Added extraction of user_id from metadata

                    const isTrial = eventMetadata.is_trial === 'true'; // Added determination of isTrial

                    console.log('📧 Email del usuario (subscription):', actualEmail);
                    console.log('📊 Metadata completo (subscription):', JSON.stringify(eventMetadata, null, 2));
                    console.log('📊 Status Stripe (subscription):', actualStripeSubscription.status);
                    console.log('📊 Subscription ID (subscription):', actualStripeSubscription.id);
                    console.log('📊 Customer ID (subscription):', actualStripeSubscription.customer);
                    console.log('🎁 Is Trial:', isTrial); // Added log
                    
                    // ✅ CRÍTICO: Marcar trial como usado también en subscription.created
                    if (isTrial && actualUserId) {
                        console.log('🎁 [TRIAL] Marcando periodo gratuito como USADO para user:', actualUserId);
                        try {
                            await base44.asServiceRole.entities.User.update(actualUserId, {
                                free_trial_used: true
                            });
                            console.log('✅ [TRIAL] Campo free_trial_used = true GUARDADO en BD');
                            
                            const updatedUsers = await base44.asServiceRole.entities.User.filter({ id: actualUserId });
                            if (updatedUsers[0]) {
                                console.log('🔍 [TRIAL VERIFY] free_trial_used en BD:', updatedUsers[0].free_trial_used);
                            }
                        } catch (error) {
                            console.error('❌ [TRIAL] Error CRÍTICO actualizando free_trial_used:', error);
                        }
                    }
                }

                if (!actualEmail) {
                    console.error('❌ Sin email disponible en el evento para la suscripción');
                    console.log('📋 Metadata disponible:', eventMetadata);
                    return Response.json({ error: 'Missing email' }, { status: 400 });
                }

                console.log('1️⃣ Buscando/creando usuario...');
                let users = await base44.asServiceRole.entities.User.filter({ email: actualEmail });
                let finalUserId;

                if (users.length === 0) {
                    console.log('➕ Creando nuevo usuario...');
                    try {
                        const newUser = await base44.asServiceRole.entities.User.create({
                            email: actualEmail,
                            full_name: eventMetadata.fullName || actualEmail.split('@')[0],
                            phone: eventMetadata.phone || '',
                            city: eventMetadata.address || '',
                            user_type: 'professionnel',
                            subscription_status: actualStripeSubscription.status === 'trialing' ? 'en_prueba' : 'activo',
                            free_trial_used: eventMetadata.is_trial === 'true' ? true : false // ✅ NUEVO
                        });
                        finalUserId = newUser.id;
                        console.log('✅ Usuario creado:', finalUserId);
                    } catch (createError) {
                        console.error('❌ Error creando usuario:', createError);
                        throw createError;
                    }
                } else {
                    finalUserId = users[0].id;
                    console.log('✅ Usuario encontrado:', finalUserId);
                    
                    try {
                        const updateData = {
                            user_type: 'professionnel',
                            subscription_status: actualStripeSubscription.status === 'trialing' ? 'en_prueba' : 'activo'
                        };
                        
                        // ✅ CRÍTICO: Si es trial, marcar como usado
                        if (eventMetadata.is_trial === 'true') {
                            updateData.free_trial_used = true;
                            console.log('🎁 [TRIAL] Marcando free_trial_used = true al actualizar usuario');
                        }
                        
                        await base44.asServiceRole.entities.User.update(finalUserId, updateData);
                        console.log('✅ Usuario actualizado a profesional');
                        
                        // Verificar
                        const verifyUser = await base44.asServiceRole.entities.User.filter({ id: finalUserId });
                        if (verifyUser[0]) {
                            console.log('🔍 [VERIFY] free_trial_used después de update:', verifyUser[0].free_trial_used);
                        }
                    } catch (updateError) {
                        console.error('❌ Error actualizando usuario:', updateError);
                    }
                }

                // Consolidate userId to be used consistently
                actualUserId = finalUserId; 

                console.log('2️⃣ Calculando estado del perfil...');
                const profileStatus = calculateProfileStatus(
                    actualStripeSubscription.status,
                    actualStripeSubscription.current_period_end
                );
                console.log('📋 Estado calculado:', profileStatus);

                console.log('3️⃣ Buscando plan...');
                // If plan wasn't fetched by the checkout.session.completed block
                if (!subscriptionPlan) {
                    const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
                        plan_id: actualPlanId
                    });
                    subscriptionPlan = plans[0];
                }

                if (!subscriptionPlan) {
                    console.error('❌ Plan no encontrado:', actualPlanId);
                    return Response.json({ error: 'Plan not found' }, { status: 404 });
                }
                console.log('💼 Plan encontrado:', subscriptionPlan.nombre);

                console.log('4️⃣ Creando/actualizando suscripción...');
                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                    user_id: actualUserId
                });

                const subscriptionData = {
                    user_id: actualUserId,
                    plan_id: actualPlanId,
                    plan_nombre: subscriptionPlan.nombre,
                    plan_precio: subscriptionPlan.precio,
                    fecha_inicio: new Date(actualStripeSubscription.current_period_start * 1000).toISOString(),
                    fecha_expiracion: new Date(actualStripeSubscription.current_period_end * 1000).toISOString(),
                    estado: profileStatus.estado,
                    renovacion_automatica: actualStripeSubscription.cancel_at_period_end === false,
                    metodo_pago: 'stripe',
                    stripe_subscription_id: actualStripeSubscription.id,
                    stripe_customer_id: actualStripeSubscription.customer
                };

                console.log('💳 Datos de suscripción:', subscriptionData);

                try {
                    if (existingSubs.length > 0) {
                        console.log('🔄 Actualizando suscripción existente ID:', existingSubs[0].id);
                        await base44.asServiceRole.entities.Subscription.update(
                            existingSubs[0].id,
                            subscriptionData
                        );
                    } else {
                        console.log('➕ Creando nueva suscripción...');
                        await base44.asServiceRole.entities.Subscription.create(subscriptionData);
                    }
                    console.log('✅ Suscripción guardada correctamente');
                } catch (subError) {
                    console.error('❌ Error guardando suscripción:', subError);
                    throw subError;
                }

                console.log('5️⃣ Actualizando perfil profesional si existe...');
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: actualUserId
                });

                if (profiles.length > 0) {
                    console.log('🔄 Actualizando perfil existente ID:', profiles[0].id);
                    try {
                        await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                            visible_en_busqueda: profileStatus.visible_en_busqueda,
                            estado_perfil: profileStatus.estado_perfil
                        });
                        console.log(`✅ Perfil actualizado - Visible: ${profileStatus.visible_en_busqueda}`);
                    } catch (profileError) {
                        console.error('❌ Error actualizando perfil:', profileError);
                    }
                } else {
                    console.log('ℹ️ Perfil aún no existe (se creará en onboarding)');
                }

                console.log('✅ ========== SUSCRIPCIÓN PROCESADA ==========');
                console.log(`📊 Estado final: ${profileStatus.mensaje}`);
                console.log(`📧 Usuario: ${actualEmail}`);
                console.log(`🆔 User ID: ${actualUserId}`);
                console.log(`💳 Subscription ID: ${actualStripeSubscription.id}`);
                break;
            }

            case 'customer.subscription.updated': {
                console.log('\n🔄 ========== SUSCRIPCIÓN ACTUALIZADA ==========');
                
                const subscription = event.data.object; // For this event, data.object IS the subscription
                const metadata = subscription.metadata || {};
                const email = metadata.email || subscription.customer_email;

                console.log('📧 Email del usuario:', email);
                console.log('📊 Metadata completo:', JSON.stringify(metadata, null, 2));
                console.log('📊 Status Stripe:', subscription.status);
                console.log('📊 Subscription ID:', subscription.id);
                console.log('📊 Customer ID:', subscription.customer);

                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length === 0) {
                    console.log('⚠️ Suscripción no encontrada en BD para actualización');
                    return Response.json({ received: true });
                }

                const dbSub = subs[0];
                const profileStatus = calculateProfileStatus(
                    subscription.status,
                    subscription.current_period_end
                );

                console.log('📋 Nuevo estado:', profileStatus);

                // Actualizar suscripción
                await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                    estado: profileStatus.estado,
                    fecha_expiracion: new Date(subscription.current_period_end * 1000).toISOString(),
                    renovacion_automatica: subscription.cancel_at_period_end === false
                });

                console.log('💳 Renovación automática:', subscription.cancel_at_period_end === false);

                // Actualizar perfil
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: dbSub.user_id
                });

                if (profiles.length > 0) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: profileStatus.visible_en_busqueda,
                        estado_perfil: profileStatus.estado_perfil
                    });
                    console.log(`✅ Visibilidad actualizada: ${profileStatus.visible_en_busqueda}`);
                }

                // Actualizar estado del usuario
                await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                    subscription_status: profileStatus.estado
                });

                console.log('✅ Suscripción actualizada:', profileStatus.mensaje);
                break;
            }

            case 'customer.subscription.trial_will_end': {
                console.log('⏰ Trial terminará pronto (3 días antes)');
                // No need to fetch subscription details, just logging
                break;
            }

            case 'customer.subscription.deleted': {
                console.log('\n🔴 ========== SUSCRIPCIÓN ELIMINADA/EXPIRADA ==========');
                
                const subscription = event.data.object; // For this event, data.object IS the subscription
                const metadata = subscription.metadata || {};
                const email = metadata.email || subscription.customer_email;

                console.log('📧 Email del usuario:', email);
                console.log('📊 Metadata completo:', JSON.stringify(metadata, null, 2));
                console.log('📊 Status Stripe:', subscription.status);
                console.log('📊 Subscription ID:', subscription.id);
                console.log('📊 Customer ID:', subscription.customer);

                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length === 0) {
                    console.log('⚠️ Suscripción no encontrada en BD para eliminación');
                    return Response.json({ received: true });
                }

                const dbSub = subs[0];
                
                // Marcar como finalizada
                await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                    estado: 'finalizada',
                    renovacion_automatica: false
                });

                // ✅ OCULTAR PERFIL INMEDIATAMENTE
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: dbSub.user_id
                });

                if (profiles.length > 0) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: false,
                        estado_perfil: 'inactivo'
                    });
                    console.log('❌ Perfil ocultado de búsquedas');
                }

                // Actualizar usuario
                await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                    subscription_status: 'finalizada'
                });

                // ✅ Ejecutar limpieza automática
                console.log('🧹 Ejecutando limpieza automática...');
                try {
                    await base44.asServiceRole.functions.invoke('cleanOrphanData');
                } catch (cleanupError) {
                    console.log('⚠️ Error en limpieza automática:', cleanupError.message);
                }

                console.log('✅ Suscripción finalizada y perfil oculto');
                break;
            }
            
            case 'invoice.payment_succeeded': {
                console.log('\n💰 ========== PAGO EXITOSO ==========');
                const invoice = event.data.object;
                const subscriptionId = invoice.subscription;

                if (!subscriptionId) {
                    console.log('⚠️ No se encontró ID de suscripción en el invoice para pago exitoso.');
                    return Response.json({ received: true });
                }

                // Retrieve the full subscription object
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const metadata = subscription.metadata || {};
                const email = metadata.email || subscription.customer_email;

                console.log('📧 Email del usuario:', email);
                console.log('📊 Metadata completo:', JSON.stringify(metadata, null, 2));
                console.log('📊 Status Stripe:', subscription.status);
                console.log('📊 Subscription ID:', subscription.id);
                console.log('📊 Customer ID:', subscription.customer);

                // The 'customer.subscription.updated' event should handle most of this,
                // but we can ensure state is correct here as a fallback or for specific actions.
                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length > 0) {
                    const dbSub = subs[0];
                    const profileStatus = calculateProfileStatus(
                        subscription.status,
                        subscription.current_period_end
                    );

                    await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                        estado: profileStatus.estado,
                        fecha_expiracion: new Date(subscription.current_period_end * 1000).toISOString(),
                        renovacion_automatica: subscription.cancel_at_period_end === false
                    });

                    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                        user_id: dbSub.user_id
                    });

                    if (profiles.length > 0) {
                        await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                            visible_en_busqueda: profileStatus.visible_en_busqueda,
                            estado_perfil: profileStatus.estado_perfil
                        });
                    }

                    await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                        subscription_status: profileStatus.estado
                    });
                    console.log('✅ Estado de suscripción y perfil actualizados tras pago exitoso.');
                } else {
                    console.log('⚠️ Suscripción no encontrada en BD para pago exitoso, posible nueva suscripción o error previo.');
                }
                break;
            }

            case 'invoice.payment_failed': {
                console.log('❌ Pago fallido');
                
                const invoice = event.data.object;
                const subscriptionId = invoice.subscription;

                if (!subscriptionId) {
                    console.log('⚠️ No se encontró ID de suscripción en el invoice para pago fallido.');
                    return Response.json({ received: true });
                }

                // Retrieve the full subscription object
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const metadata = subscription.metadata || {};
                const email = metadata.email || subscription.customer_email;

                console.log('📧 Email del usuario:', email);
                console.log('📊 Metadata completo:', JSON.stringify(metadata, null, 2));
                console.log('📊 Status Stripe:', subscription.status);
                console.log('📊 Subscription ID:', subscription.id);
                console.log('📊 Customer ID:', subscription.customer);

                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length > 0) {
                    const dbSub = subs[0];
                    
                    // Si ya expiró, ocultar. Stripe manejará el estado a `past_due` o `canceled` eventualmente.
                    // Aquí, el objetivo es reaccionar si el pago falla y la suscripción ya no es activa.
                    if (!isSubscriptionActive(subscription.status, subscription.current_period_end)) {
                        await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                            estado: 'finalizada' // O un estado intermedio como 'pago_fallido' si se desea más granularidad
                        });

                        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                            user_id: dbSub.user_id
                        });

                        if (profiles.length > 0) {
                            await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                                visible_en_busqueda: false,
                                estado_perfil: 'inactivo'
                            });
                            console.log('❌ Perfil ocultado por fallo de pago y suscripción inactiva');
                        }
                        
                        await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                            subscription_status: 'finalizada' // O 'pago_fallido'
                        });
                    } else {
                        console.log('ℹ️ Pago fallido pero la suscripción aún está activa (ej. en período de gracia o reintento).');
                        // Actualizar estado del usuario a 'pago_fallido' si se desea un estado más granular
                        await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                            subscription_status: 'pago_fallido' // Nuevo estado si aplica
                        });
                    }
                } else {
                    console.log('⚠️ Suscripción no encontrada en BD para pago fallido.');
                }

                console.log('⚠️ Pago fallido procesado');
                break;
            }

            default:
                console.log('ℹ️ Evento no manejado:', event.type);
        }

        return Response.json({ received: true, processed: true });

    } catch (error) {
        console.error('❌ ========== ERROR EN WEBHOOK ==========');
        console.error('❌ Message:', error.message);
        console.error('❌ Stack:', error.stack);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});
