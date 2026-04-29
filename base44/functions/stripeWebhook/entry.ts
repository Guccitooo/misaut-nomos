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

        const subscription = event.data.object;
        const metadata = subscription.metadata || {};
        const email = metadata.email || subscription.customer_email;

        console.log('📧 Email del usuario:', email);
        console.log('📊 Metadata completo:', JSON.stringify(metadata, null, 2));
        console.log('📊 Status Stripe:', subscription.status);
        console.log('📊 Subscription ID:', subscription.id);
        console.log('📊 Customer ID:', subscription.customer);

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
                
                if (!email) {
                    console.error('❌ Sin email en metadata');
                    console.log('📋 Metadata disponible:', metadata);
                    console.log('📋 Customer email:', subscription.customer_email);
                    return Response.json({ error: 'Missing email' }, { status: 400 });
                }

                console.log('1️⃣ Buscando/creando usuario...');
                let users = await base44.asServiceRole.entities.User.filter({ email });
                let userId;

                if (users.length === 0) {
                    console.log('➕ Creando nuevo usuario...');
                    try {
                        const newUser = await base44.asServiceRole.entities.User.create({
                            email,
                            full_name: metadata.fullName || email.split('@')[0],
                            phone: metadata.phone || '',
                            city: metadata.address || '',
                            user_type: 'professionnel',
                            subscription_status: subscription.status === 'trialing' ? 'en_prueba' : 'activo'
                        });
                        userId = newUser.id;
                        console.log('✅ Usuario creado:', userId);
                    } catch (createError) {
                        console.error('❌ Error creando usuario:', createError);
                        throw createError; // Re-throw to be caught by the main try-catch
                    }
                } else {
                    userId = users[0].id;
                    console.log('✅ Usuario encontrado:', userId);
                    
                    // ✅ ACTUALIZAR USUARIO CON ESTADO NORMALIZADO
                    try {
                        await base44.asServiceRole.entities.User.update(userId, {
                            user_type: 'professionnel',
                            subscription_status: subscription.status === 'trialing' ? 'en_prueba' : 'activo'
                        });
                        console.log('✅ Usuario actualizado a profesional');
                    } catch (updateError) {
                        console.error('❌ Error actualizando usuario:', updateError);
                        // Log the error but continue as the user exists and we need to proceed with subscription/profile updates.
                    }
                }

                console.log('2️⃣ Calculando estado del perfil...');
                const profileStatus = calculateProfileStatus(
                    subscription.status,
                    subscription.current_period_end
                );

                console.log('📋 Estado calculado:', profileStatus);

                console.log('3️⃣ Buscando plan...');
                const planId = metadata.planId || 'plan_monthly_trial';
                const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
                    plan_id: planId
                });
                const plan = plans[0];

                if (!plan) {
                    console.error('❌ Plan no encontrado:', planId);
                    return Response.json({ error: 'Plan not found' }, { status: 404 });
                }

                console.log('💼 Plan encontrado:', plan.nombre);

                console.log('4️⃣ Creando/actualizando suscripción...');
                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                    user_id: userId
                });

                // ✅ CRÍTICO: Renovación automática TRUE si NO está explícitamente cancelado
                const subscriptionData = {
                    user_id: userId,
                    plan_id: planId,
                    plan_nombre: plan.nombre,
                    plan_precio: plan.precio,
                    fecha_inicio: new Date(subscription.current_period_start * 1000).toISOString(),
                    fecha_expiracion: new Date(subscription.current_period_end * 1000).toISOString(),
                    estado: profileStatus.estado,
                    renovacion_automatica: subscription.cancel_at_period_end === false,
                    metodo_pago: 'stripe',
                    stripe_subscription_id: subscription.id,
                    stripe_customer_id: subscription.customer
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
                    throw subError; // Re-throw to be caught by the main try-catch
                }

                console.log('5️⃣ Actualizando perfil profesional si existe...');
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: userId
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
                        // Log the error but continue, as the subscription is already handled.
                    }
                } else {
                    console.log('ℹ️ Perfil aún no existe (se creará en onboarding)');
                }

                console.log('✅ ========== SUSCRIPCIÓN PROCESADA ==========');
                console.log(`📊 Estado final: ${profileStatus.mensaje}`);
                console.log(`📧 Usuario: ${email}`);
                console.log(`🆔 User ID: ${userId}`);
                console.log(`💳 Subscription ID: ${subscription.id}`);

                // Notificar admin nueva suscripción (fire-and-forget)
                fetch(new URL('/notifyAdmin', req.url).toString(), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'new_subscription',
                    severity: 'high',
                    title: '💰 Nueva suscripción',
                    body: `<strong>${email}</strong> ha empezado plan <strong>${plan.nombre}</strong> (${subscription.status}).`,
                    data: {
                      user_id: userId,
                      email,
                      stripe_customer_id: subscription.customer,
                      stripe_subscription_id: subscription.id,
                      plan: plan.nombre,
                      status: subscription.status
                    }
                  })
                }).catch(() => {});
                break;
            }

            case 'customer.subscription.updated': {
                console.log('\n🔄 ========== SUSCRIPCIÓN ACTUALIZADA ==========');
                
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
                break;
            }

            case 'customer.subscription.deleted': {
                console.log('\n🔴 ========== SUSCRIPCIÓN ELIMINADA/EXPIRADA ==========');
                
                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length === 0) {
                    console.log('⚠️ Suscripción no encontrada en BD');
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

                // Notificar admin cancelación (fire-and-forget)
                fetch(new URL('/notifyAdmin', req.url).toString(), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'subscription_cancelled',
                    severity: 'medium',
                    title: '🔴 Suscripción cancelada/finalizada',
                    body: `La suscripción de usuario <strong>${dbSub.user_id}</strong> ha sido eliminada por Stripe.`,
                    data: { user_id: dbSub.user_id, stripe_subscription_id: subscription.id }
                  })
                }).catch(() => {});
                break;
            }

            case 'invoice.payment_failed': {
                console.log('❌ Pago fallido');
                
                if (!subscription?.id) {
                    console.log('⚠️ Sin ID de suscripción en invoice');
                    return Response.json({ received: true });
                }

                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length > 0) {
                    const dbSub = subs[0];
                    
                    // Si ya expiró, ocultar
                    if (!isSubscriptionActive(subscription.status, subscription.current_period_end)) {
                        await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                            estado: 'finalizada'
                        });

                        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                            user_id: dbSub.user_id
                        });

                        if (profiles.length > 0) {
                            await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                                visible_en_busqueda: false,
                                estado_perfil: 'inactivo'
                            });
                            console.log('❌ Perfil ocultado por fallo de pago');
                        }
                    }
                }

                console.log('⚠️ Pago fallido procesado');

                // Notificar admin pago fallido (fire-and-forget)
                fetch(new URL('/notifyAdmin', req.url).toString(), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'payment_failed',
                    severity: 'high',
                    title: '❌ Pago fallido',
                    body: `Fallo de pago en suscripción <strong>${subscription.id}</strong>.`,
                    data: { stripe_subscription_id: subscription.id }
                  })
                }).catch(() => {});
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