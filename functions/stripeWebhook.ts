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

        // Define isActive and profileStatus early for consistent use
        const isActive = isSubscriptionActive(subscription.status, subscription.current_period_end);
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
            
            // ⚪ Cancelado pero con tiempo restante (incluye trial cancelado)
            if (subscriptionStatus === 'canceled' && isSubscriptionActive(subscriptionStatus, endDate)) {
                return {
                    estado: 'cancelado',
                    visible_en_busqueda: true,
                    estado_perfil: 'activo',
                    mensaje: 'Cancelado - visible hasta fin de periodo'
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

        const profileStatus = calculateProfileStatus(
            subscription.status,
            subscription.current_period_end
        );

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

                const isTrialing = subscription.status === 'trialing';
                
                const userData = {
                    email,
                    full_name: metadata.fullName || email.split('@')[0],
                    phone: metadata.phone || '',
                    city: metadata.address || '',
                    user_type: 'professionnel',
                    has_used_trial: true,
                    first_trial_date: isTrialing ? new Date().toISOString() : undefined
                };

                if (users.length === 0) {
                    console.log('➕ Creando nuevo usuario...');
                    const newUser = await base44.asServiceRole.entities.User.create(userData);
                    userId = newUser.id;
                    console.log('✅ Usuario creado:', userId);
                } else {
                    userId = users[0].id;
                    console.log('✅ Usuario encontrado:', userId);
                    
                    await base44.asServiceRole.entities.User.update(userId, userData);
                    console.log('✅ Usuario actualizado con detalles de suscripción y tipo');
                }

                console.log('2️⃣ Calculando estado del perfil...');
                // profileStatus already calculated above.

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
                    cancel_at_period_end: subscription.cancel_at_period_end === true,
                    metodo_pago: 'stripe',
                    stripe_subscription_id: subscription.id,
                    stripe_customer_id: subscription.customer,
                    trial_start: isTrialing ? new Date(subscription.current_period_start * 1000).toISOString() : null,
                    trial_end: isTrialing ? new Date(subscription.current_period_end * 1000).toISOString() : null
                };

                console.log('💳 Datos de suscripción:', subscriptionData);

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

                console.log('5️⃣ Actualizando perfil profesional si existe...');
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: userId
                });

                if (profiles.length > 0) {
                    const profile = profiles[0];
                    console.log('🔄 Actualizando perfil existente ID:', profile.id);
                    
                    const today = new Date();
                    const expirationDate = new Date(subscriptionData.fecha_expiracion);
                    const isStillInPeriod = expirationDate > today;
                    const isTrial = subscription.status === 'trialing';
                    const isCanceled = subscription.cancel_at_period_end === true;
                    
                    const shouldBeVisible = (
                        (subscription.status === 'active' && isStillInPeriod) ||
                        (isTrial && isStillInPeriod) ||
                        (isCanceled && isStillInPeriod)
                    );
                    
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                        visible_en_busqueda: shouldBeVisible,
                        estado_perfil: shouldBeVisible ? 'activo' : 'inactivo'
                    });
                    console.log(`✅ Perfil actualizado - Visible: ${shouldBeVisible} (trial: ${isTrial}, cancelado: ${isCanceled}, vigente: ${isStillInPeriod})`);
                } else {
                    console.log('ℹ️ Perfil aún no existe (se creará en onboarding)');
                }

                const isTrialing = subscription.status === 'trialing';
                const planName = plan.nombre;
                const planMessage = isTrialing 
                    ? `¡Bienvenido! Disfruta 2 meses gratis con ${planName}` 
                    : `¡Tu suscripción a ${planName} está activa!`;

                // ✅ Email de bienvenida profesional
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: metadata.email,
                    subject: planMessage,
                    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 8px; }
    .success-box h3 { color: #065f46; margin: 0 0 15px 0; font-size: 20px; }
    .success-box p { color: #047857; margin: 5px 0; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎉</div>
      <h1>${planMessage}</h1>
    </div>
    
    <div class="content">
      <p class="greeting">¡Hola ${metadata.fullName || metadata.email}!</p>
      
      <div class="success-box">
        <h3>✅ Pago confirmado</h3>
        <p>Tu suscripción está activa. Ahora completa tu perfil para empezar.</p>
      </div>
      
      <p class="message">
        <strong>📋 Detalles de tu plan:</strong>
      </p>
      <ul style="color: #4b5563; line-height: 1.8; margin-bottom: 25px;">
        <li><strong>Plan:</strong> ${planName}</li>
        <li><strong>Estado:</strong> ${isTrialing ? 'Prueba gratuita (2 meses)' : 'Activo'}</li>
        <li><strong>Renovación:</strong> ${new Date(subscription.current_period_end * 1000).toLocaleDateString('es-ES')}</li>
      </ul>
      
      <div class="cta">
        <a href="https://misautonomos.es/ProfileOnboarding" class="button">
          Completar mi perfil →
        </a>
      </div>
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        ¿Necesitas ayuda?<br/>
        <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6; text-decoration: none;">soporte@misautonomos.es</a>
      </p>
    </div>
    
    <div class="footer">
      <strong>Equipo Misautónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
                        `,
                    from_name: "Misautónomos"
                });

                console.log('✅ ========== SUSCRIPCIÓN PROCESADA ==========');
                console.log(`📊 Estado final: ${profileStatus.mensaje}`);
                console.log(`📧 Usuario: ${email}`);
                console.log(`🆔 User ID: ${userId}`);
                console.log(`💳 Subscription ID: ${subscription.id}`);
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
                // profileStatus already calculated above for consistency.

                console.log('📋 Nuevo estado:', profileStatus);

                const isTrial = subscription.status === 'trialing';
                
                // Actualizar suscripción
                await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                    estado: profileStatus.estado,
                    fecha_expiracion: new Date(subscription.current_period_end * 1000).toISOString(),
                    renovacion_automatica: subscription.cancel_at_period_end === false,
                    cancel_at_period_end: subscription.cancel_at_period_end === true,
                    trial_end: isTrial ? new Date(subscription.current_period_end * 1000).toISOString() : dbSub.trial_end
                });

                console.log('💳 Renovación automática:', subscription.cancel_at_period_end === false);

                // Actualizar perfil
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: dbSub.user_id
                });

                if (profiles.length > 0) {
                    const today = new Date();
                    const expirationDate = new Date(subscription.current_period_end * 1000);
                    const isStillInPeriod = expirationDate > today;
                    const isTrial = subscription.status === 'trialing';
                    const isCanceled = subscription.cancel_at_period_end === true;
                    
                    const shouldBeVisible = (
                        (subscription.status === 'active' && isStillInPeriod) ||
                        (isTrial && isStillInPeriod) ||
                        (isCanceled && isStillInPeriod)
                    );
                    
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: shouldBeVisible,
                        estado_perfil: shouldBeVisible ? 'activo' : 'inactivo'
                    });
                    console.log(`✅ Visibilidad actualizada: ${shouldBeVisible} (trial: ${isTrial}, cancelado: ${isCanceled}, vigente: ${isStillInPeriod})`);
                }



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
                    renovacion_automatica: false,
                    cancel_at_period_end: false
                });

                // Ocultar perfil
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: dbSub.user_id
                });

                if (profiles.length > 0) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: false,
                        estado_perfil: 'inactivo'
                    });
                    console.log('❌ Perfil ocultado (suscripción eliminada/expirada)');
                }

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