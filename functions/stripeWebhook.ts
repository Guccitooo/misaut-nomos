import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// ✅ HELPER: Verificar si suscripción está activa
const isSubscriptionActive = (status, endDate) => {
    const today = new Date();
    const expirationDate = new Date(endDate * 1000);
    
    if (status === 'active' || status === 'trialing') {
        return expirationDate >= today;
    }
    
    if (status === 'canceled') {
        return expirationDate >= today;
    }
    
    return false;
};

// ✅ HELPER: Calcular estado del perfil según Stripe
const calculateProfileStatus = (stripeStatus, endDate) => {
    if (stripeStatus === 'active') {
        return {
            estado: 'activo',
            visible_en_busqueda: true,
            estado_perfil: 'activo'
        };
    }
    
    if (stripeStatus === 'trialing') {
        return {
            estado: 'en_prueba',
            visible_en_busqueda: true,
            estado_perfil: 'activo'
        };
    }
    
    if (stripeStatus === 'canceled' && isSubscriptionActive(stripeStatus, endDate)) {
        return {
            estado: 'cancelado',
            visible_en_busqueda: true,
            estado_perfil: 'activo'
        };
    }
    
    return {
        estado: 'finalizada',
        visible_en_busqueda: false,
        estado_perfil: 'inactivo'
    };
};

Deno.serve(async (req) => {
    console.log('🔔 ========== STRIPE WEBHOOK ==========');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
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
            console.log('✅ Evento verificado:', event.type);
        } catch (err) {
            console.error('❌ Error verificando firma:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // ✅ MANEJAR CHECKOUT COMPLETADO (momento clave)
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('\n🎉 ========== CHECKOUT COMPLETADO ==========');
            console.log('📧 Customer:', session.customer);
            console.log('📧 Email:', session.customer_email);
            console.log('💳 Subscription:', session.subscription);
            console.log('📊 Metadata:', JSON.stringify(session.metadata));

            const metadata = session.metadata || {};
            let userId = metadata.user_id;
            let userEmail = metadata.user_email || session.customer_email;
            const planId = metadata.plan_id || 'plan_monthly_trial';

            // ✅ Si no hay userId en metadata, buscar por email
            if (!userId && userEmail) {
                console.log('🔍 Buscando usuario por email:', userEmail);
                const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
                if (users.length > 0) {
                    userId = users[0].id;
                    console.log('✅ Usuario encontrado por email:', userId);
                }
            }

            if (!userId || !userEmail) {
                console.error('❌ Faltan datos: userId=', userId, 'email=', userEmail);
                return Response.json({ error: 'Missing user data' }, { status: 400 });
            }

            // ✅ OBTENER SUSCRIPCIÓN DE STRIPE (fuente de verdad)
            let stripeSubscription;
            try {
                stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
                console.log('✅ Suscripción Stripe obtenida:', stripeSubscription.id);
                console.log('📊 Status Stripe:', stripeSubscription.status);
                console.log('📊 Customer ID:', stripeSubscription.customer);
            } catch (stripeErr) {
                console.error('❌ Error obteniendo suscripción de Stripe:', stripeErr.message);
                return Response.json({ error: 'Stripe subscription not found' }, { status: 400 });
            }

            // ✅ CALCULAR ESTADO BASADO EN STRIPE
            const profileStatus = calculateProfileStatus(
                stripeSubscription.status,
                stripeSubscription.current_period_end
            );

            console.log('📋 Estado calculado:', profileStatus);

            // ✅ OBTENER PLAN
            const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: planId });
            const plan = plans[0] || { nombre: 'Plan Mensual', precio: 33 };

            // ✅ ACTUALIZAR/CREAR SUSCRIPCIÓN EN BD
            const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
            
            const subscriptionData = {
                user_id: userId,
                plan_id: planId,
                plan_nombre: plan.nombre,
                plan_precio: plan.precio,
                fecha_inicio: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
                fecha_expiracion: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                estado: profileStatus.estado,
                renovacion_automatica: !stripeSubscription.cancel_at_period_end,
                metodo_pago: 'stripe',
                stripe_subscription_id: stripeSubscription.id,
                stripe_customer_id: stripeSubscription.customer
            };

            console.log('💾 Guardando suscripción:', subscriptionData);

            if (existingSubs.length > 0) {
                await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subscriptionData);
                console.log('✅ Suscripción actualizada ID:', existingSubs[0].id);
            } else {
                await base44.asServiceRole.entities.Subscription.create(subscriptionData);
                console.log('✅ Suscripción creada');
            }

            // ✅ ACTUALIZAR USUARIO - CRÍTICO: Cambiar a profesional
            const userUpdateData = {
                user_type: 'professionnel',  // ✅ SIEMPRE cambiar a profesional al pagar
                subscription_status: profileStatus.estado,
                subscription_start_date: new Date(stripeSubscription.current_period_start * 1000).toISOString().split('T')[0],
                subscription_end_date: new Date(stripeSubscription.current_period_end * 1000).toISOString().split('T')[0]
            };

            if (stripeSubscription.status === 'trialing' || metadata.trial_offered === 'true') {
                userUpdateData.has_used_trial = true;
            }

            console.log('📝 Actualizando usuario con:', userUpdateData);
            await base44.asServiceRole.entities.User.update(userId, userUpdateData);
            console.log('✅ Usuario actualizado a user_type: professionnel');

            // ✅ ACTUALIZAR O CREAR PERFIL PROFESIONAL
            const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: userId });
            if (profiles.length > 0) {
                const existingProfile = profiles[0];
                // Si onboarding completado -> visible inmediatamente (suscripción ya verificada)
                const shouldBeVisible = existingProfile.onboarding_completed === true;
                
                const profileUpdateData = {
                    visible_en_busqueda: shouldBeVisible,
                    estado_perfil: 'activo'
                };
                
                await base44.asServiceRole.entities.ProfessionalProfile.update(existingProfile.id, profileUpdateData);
                console.log(`✅ Perfil actualizado - Visible: ${shouldBeVisible} (onboarding: ${existingProfile.onboarding_completed})`);
                
                // Si ya tiene onboarding completo, forzar visibilidad
                if (existingProfile.onboarding_completed && !shouldBeVisible) {
                    console.log('⚠️ Forzando visibilidad porque onboarding está completo');
                    await base44.asServiceRole.entities.ProfessionalProfile.update(existingProfile.id, {
                        visible_en_busqueda: true
                    });
                }
            } else {
                // Crear perfil básico para el nuevo profesional
                await base44.asServiceRole.entities.ProfessionalProfile.create({
                    user_id: userId,
                    business_name: userEmail.split('@')[0],
                    email_contacto: userEmail,
                    visible_en_busqueda: false,
                    estado_perfil: 'activo',
                    onboarding_completed: false,
                    categories: [],
                    photos: [],
                    formas_pago: [],
                    metodos_contacto: ['chat_interno']
                });
                console.log('✅ Perfil nuevo creado - Esperando onboarding');
            }

            // ✅ ENVIAR EMAIL DE BIENVENIDA
            const isTrialing = stripeSubscription.status === 'trialing';
            const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';
            const renewalDate = new Date(stripeSubscription.current_period_end * 1000).toLocaleDateString('es-ES', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: userEmail,
                subject: isTrialing 
                    ? `🎉 ¡Bienvenido a MisAutónomos! Tu prueba de 60 días ha comenzado`
                    : `✅ ¡Tu suscripción a MisAutónomos está activa!`,
                body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 40px; text-align: center; border-radius: 16px 16px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 40px; }
    .highlight { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .highlight h3 { color: #047857; margin: 0 0 8px 0; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: #f97316; color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; border-radius: 0 0 16px 16px; }
    .footer a { color: #60a5fa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="MisAutónomos" style="width: 64px; height: 64px; border-radius: 12px; margin-bottom: 16px;" />
      <h1>${isTrialing ? '🎉 ¡Bienvenido!' : '✅ ¡Suscripción activa!'}</h1>
    </div>
    <div class="content">
      <p style="font-size: 18px; color: #1f2937;">¡Hola!</p>
      <div class="highlight">
        <h3>${isTrialing ? '🎁 60 días GRATIS' : '✅ Pago confirmado'}</h3>
        <p style="color: #065f46; margin: 0;">${isTrialing 
          ? 'Tu cuenta está activa. Tienes 60 días para probar todas las funcionalidades.' 
          : 'Tu suscripción está activa y tu perfil es visible para clientes.'}</p>
      </div>
      <p><strong>Plan:</strong> ${plan.nombre}</p>
      <p><strong>${isTrialing ? 'Fecha de cobro:' : 'Próxima renovación:'}</strong> ${renewalDate}</p>
      <p><strong>ID Stripe:</strong> ${stripeSubscription.id}</p>
      <div class="cta">
        <a href="https://misautonomos.es/ProfileOnboarding" class="button">Completar mi perfil →</a>
      </div>
      ${isTrialing ? '<p style="font-size: 13px; color: #6b7280; text-align: center;">Puedes cancelar en cualquier momento antes de que termine la prueba.</p>' : ''}
    </div>
    <div class="footer">
      <strong style="color: #fff;">MisAutónomos</strong><br/>
      <a href="https://misautonomos.es">misautonomos.es</a> · <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a>
    </div>
  </div>
</body>
</html>`,
                from_name: "MisAutónomos"
            });

            console.log('📧 Email de bienvenida enviado');
            
            // ✅ VERIFICACIÓN FINAL: Si el perfil tiene onboarding completo, forzar visibilidad
            const finalProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: userId });
            if (finalProfiles.length > 0 && finalProfiles[0].onboarding_completed === true) {
                await base44.asServiceRole.entities.ProfessionalProfile.update(finalProfiles[0].id, {
                    visible_en_busqueda: true,
                    estado_perfil: 'activo'
                });
                console.log('✅ FORZADO: Perfil visible porque onboarding completo + pago confirmado');
            }
            
            console.log('✅ ========== CHECKOUT PROCESADO ==========');
            return Response.json({ received: true, processed: true });
        }

        // ✅ SUSCRIPCIÓN ACTUALIZADA
        if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object;
            console.log('\n🔄 ========== SUSCRIPCIÓN ACTUALIZADA ==========');
            console.log('📊 ID:', subscription.id);
            console.log('📊 Status:', subscription.status);

            const subs = await base44.asServiceRole.entities.Subscription.filter({
                stripe_subscription_id: subscription.id
            });

            if (subs.length === 0) {
                console.log('⚠️ Suscripción no encontrada en BD');
                return Response.json({ received: true });
            }

            const dbSub = subs[0];
            const profileStatus = calculateProfileStatus(subscription.status, subscription.current_period_end);

            await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                estado: profileStatus.estado,
                fecha_expiracion: new Date(subscription.current_period_end * 1000).toISOString(),
                renovacion_automatica: !subscription.cancel_at_period_end
            });

            // Actualizar perfil
            const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: dbSub.user_id });
            if (profiles.length > 0) {
                await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                    visible_en_busqueda: profileStatus.visible_en_busqueda,
                    estado_perfil: profileStatus.estado_perfil
                });
            }

            // Actualizar usuario
            await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                subscription_status: profileStatus.estado
            });

            console.log('✅ Suscripción actualizada:', profileStatus.estado);
            return Response.json({ received: true, processed: true });
        }

        // ✅ SUSCRIPCIÓN ELIMINADA
        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            console.log('\n🔴 ========== SUSCRIPCIÓN ELIMINADA ==========');

            const subs = await base44.asServiceRole.entities.Subscription.filter({
                stripe_subscription_id: subscription.id
            });

            if (subs.length > 0) {
                const dbSub = subs[0];
                
                await base44.asServiceRole.entities.Subscription.update(dbSub.id, {
                    estado: 'finalizada',
                    renovacion_automatica: false
                });

                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: dbSub.user_id });
                if (profiles.length > 0) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                        visible_en_busqueda: false,
                        estado_perfil: 'inactivo'
                    });
                }

                await base44.asServiceRole.entities.User.update(dbSub.user_id, {
                    subscription_status: 'finalizada'
                });

                console.log('✅ Suscripción finalizada y perfil oculto');
            }

            return Response.json({ received: true, processed: true });
        }

        // ✅ PAGO FALLIDO
        if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object;
            console.log('\n❌ ========== PAGO FALLIDO ==========');

            if (invoice.subscription) {
                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: invoice.subscription
                });

                if (subs.length > 0) {
                    const dbSub = subs[0];
                    const users = await base44.asServiceRole.entities.User.filter({ id: dbSub.user_id });
                    
                    if (users.length > 0) {
                        const user = users[0];
                        const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';
                        
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: user.email,
                            subject: `⚠️ Problema con tu pago - MisAutónomos`,
                            body: `
<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial;background:#f8fafc}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px}.header{background:#ef4444;padding:30px;text-align:center;border-radius:16px 16px 0 0}.header h1{color:#fff;margin:0}.content{padding:30px}.error{background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:20px 0}.button{display:inline-block;background:#ef4444;color:#fff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:bold}</style></head>
<body>
<div class="container">
  <div class="header"><img src="${LOGO_URL}" style="width:50px;height:50px;border-radius:10px;margin-bottom:10px"/><h1>⚠️ Problema con tu pago</h1></div>
  <div class="content">
    <div class="error"><p><strong>No hemos podido cobrar tu suscripción.</strong></p><p>Tu perfil puede dejar de ser visible si no actualizas tu método de pago.</p></div>
    <p>Posibles causas: tarjeta caducada, fondos insuficientes o bloqueo del banco.</p>
    <p style="text-align:center;margin:30px 0"><a href="https://misautonomos.es/SubscriptionManagement" class="button">Actualizar pago →</a></p>
    <p style="font-size:13px;color:#666;text-align:center">¿Problemas? <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a></p>
  </div>
</div>
</body>
</html>`,
                            from_name: "MisAutónomos"
                        });
                        console.log('📧 Email de pago fallido enviado');
                    }
                }
            }

            return Response.json({ received: true, processed: true });
        }

        console.log('ℹ️ Evento no manejado:', event.type);
        return Response.json({ received: true });

    } catch (error) {
        console.error('❌ ERROR WEBHOOK:', error.message);
        console.error('❌ Stack:', error.stack);
        return Response.json({ error: error.message }, { status: 500 });
    }
});