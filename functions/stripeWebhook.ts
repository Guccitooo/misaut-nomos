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

                const userData = {
                    email,
                    full_name: metadata.fullName || email.split('@')[0],
                    phone: metadata.phone || '',
                    city: metadata.address || '',
                    user_type: metadata.userType || 'professionnel', // Use metadata for userType
                    subscription_status: profileStatus.estado, // Use calculated status
                    subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
                    subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
                };

                if (subscription.status === 'trialing' || metadata.trial_offered === 'true') {
                    userData.has_used_trial = true;
                }

                if (users.length === 0) {
                    console.log('➕ Creando nuevo usuario...');
                    try {
                        const newUser = await base44.asServiceRole.entities.User.create(userData);
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
                        await base44.asServiceRole.entities.User.update(userId, userData); // Use the prepared userData
                        console.log('✅ Usuario actualizado con detalles de suscripción y tipo');
                    } catch (updateError) {
                        console.error('❌ Error actualizando usuario:', updateError);
                        // Log the error but continue as the user exists and we need to proceed with subscription/profile updates.
                    }
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

                const isTrialing = subscription.status === 'trialing';
                const planName = plan.nombre;
                const planMessage = isTrialing 
                    ? `¡Bienvenido! Disfruta 2 meses gratis con ${planName}` 
                    : `¡Tu suscripción a ${planName} está activa!`;

                // ✅ Email de bienvenida profesional (inicio de prueba)
                const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';
                const trialDays = isTrialing ? 60 : 0;
                const renewalDate = new Date(subscription.current_period_end * 1000).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: metadata.email,
                    subject: isTrialing 
                        ? `🎉 ¡Bienvenido a MisAutónomos! Tu prueba de ${trialDays} días ha comenzado`
                        : `✅ ¡Tu suscripción a MisAutónomos está activa!`,
                    body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 64px; height: 64px; margin: 0 auto 16px; }
    .logo img { width: 100%; height: 100%; border-radius: 12px; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 15px; }
    .content { padding: 40px 32px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 700; }
    .message { color: #4b5563; line-height: 1.7; font-size: 15px; margin-bottom: 24px; }
    .highlight-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .highlight-box h3 { color: #047857; margin: 0 0 8px 0; font-size: 17px; }
    .highlight-box p { color: #065f46; margin: 4px 0; font-size: 14px; }
    .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .warning-box h3 { color: #b45309; margin: 0 0 8px 0; font-size: 17px; }
    .warning-box p { color: #78350f; margin: 4px 0; font-size: 14px; }
    .features { margin: 24px 0; list-style: none; padding: 0; }
    .features li { color: #4b5563; margin-bottom: 10px; padding-left: 24px; position: relative; line-height: 1.5; font-size: 14px; }
    .features li:before { content: '✓'; position: absolute; left: 0; color: #10b981; font-weight: bold; }
    .cta { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white !important; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; }
    .info-box { background: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .info-box p { color: #4b5563; margin: 4px 0; font-size: 13px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 28px; text-align: center; font-size: 13px; line-height: 1.6; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><img src="${LOGO_URL}" alt="MisAutónomos" /></div>
      <h1>${isTrialing ? '🎉 ¡Bienvenido a MisAutónomos!' : '✅ ¡Suscripción activa!'}</h1>
      <p>${isTrialing ? 'Tu prueba gratuita ha comenzado' : 'Tu cuenta profesional está lista'}</p>
    </div>

    <div class="content">
      <p class="greeting">¡Hola ${metadata.fullName || metadata.email.split('@')[0]}!</p>
      
      <div class="highlight-box">
        <h3>${isTrialing ? `🎁 ${trialDays} días GRATIS sin compromiso` : '✅ Pago confirmado'}</h3>
        <p>${isTrialing ? 'Tu cuenta profesional está activa. Tienes 60 días para probar todas las funcionalidades sin coste.' : 'Tu suscripción está activa y tu perfil ya es visible para clientes.'}</p>
      </div>
      
      <p class="message"><strong>¿Qué incluye tu ${isTrialing ? 'prueba gratuita' : 'suscripción'}?</strong></p>
      
      <ul class="features">
        <li>Tu perfil visible en las búsquedas de clientes</li>
        <li>Chat directo con clientes interesados</li>
        <li>Galería de fotos ilimitada</li>
        <li>Sistema de valoraciones y reseñas</li>
        <li>CRM para gestionar tus clientes</li>
        <li>Sistema de facturación integrado</li>
        <li>Soporte 24/7 vía tickets</li>
      </ul>
      
      <div class="warning-box">
        <h3>📋 Tu siguiente paso</h3>
        <p>Completa tu perfil profesional para empezar a recibir clientes. Cuanto más completo, más visibilidad tendrás.</p>
      </div>
      
      <div class="cta">
        <a href="https://misautonomos.es/ProfileOnboarding" class="button">
          Completar mi perfil →
        </a>
      </div>
      
      ${isTrialing ? `
      <div class="info-box">
        <p><strong>💳 ¿Y después de la prueba?</strong></p>
        <p>Si decides continuar, la suscripción es de ${plan.precio}€/${plan.duracion_dias === 30 ? 'mes' : plan.duracion_dias === 90 ? 'trimestre' : 'año'}. Puedes cancelar en cualquier momento antes de que termine la prueba sin coste alguno.</p>
        <p><strong>Fecha de renovación:</strong> ${renewalDate}</p>
      </div>
      ` : `
      <div class="info-box">
        <p><strong>📋 Detalles de tu plan:</strong></p>
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Próxima renovación:</strong> ${renewalDate}</p>
      </div>
      `}
      
      <p style="font-size: 13px; color: #6b7280; text-align: center;">
        ¿Necesitas ayuda? <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6;">soporte@misautonomos.es</a>
      </p>
    </div>

    <div class="footer">
      <strong style="color: #fff; font-size: 16px;">MisAutónomos</strong><br/>
      <span style="color: #60a5fa; font-style: italic;">Tu autónomo de confianza</span><br/><br/>
      <a href="https://misautonomos.es">misautonomos.es</a> · <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a><br/><br/>
      <a href="https://misautonomos.es/HelpCenter">Centro de ayuda</a> · <a href="https://misautonomos.es/PrivacyPolicy">Privacidad</a> · <a href="https://misautonomos.es/TermsConditions">Términos</a>
    </div>
  </div>
</body>
</html>
                        `,
                    from_name: "MisAutónomos"
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
                    
                    // Obtener usuario para enviar email
                    const users = await base44.asServiceRole.entities.User.filter({ id: dbSub.user_id });
                    if (users.length > 0) {
                        const user = users[0];
                        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: dbSub.user_id });
                        const userName = profiles[0]?.business_name || user.full_name || user.email.split('@')[0];
                        
                        // Enviar email de pago fallido
                        const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';
                        
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: user.email,
                            subject: `⚠️ ${userName}, hubo un problema con tu pago`,
                            body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 64px; height: 64px; margin: 0 auto 16px; }
    .logo img { width: 100%; height: 100%; border-radius: 12px; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 40px 32px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 16px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.7; font-size: 15px; margin-bottom: 20px; }
    .error-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .error-box h3 { color: #b91c1c; margin: 0 0 8px 0; font-size: 17px; }
    .error-box p { color: #991b1b; margin: 4px 0; font-size: 14px; }
    .cta { text-align: center; margin: 28px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 12px; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><img src="${LOGO_URL}" alt="MisAutónomos" /></div>
      <h1>⚠️ Problema con tu pago</h1>
    </div>
    <div class="content">
      <p class="greeting">Hola ${userName},</p>
      <div class="error-box">
        <h3>❌ No hemos podido procesar tu pago</h3>
        <p>Hubo un problema al cobrar tu suscripción. Tu perfil puede dejar de ser visible pronto.</p>
      </div>
      <p class="message">Esto puede ocurrir por: tarjeta caducada, fondos insuficientes o bloqueo temporal del banco.</p>
      <p class="message"><strong>Actualiza tu método de pago</strong> para mantener tu perfil activo.</p>
      <div class="cta">
        <a href="https://misautonomos.es/SubscriptionManagement" class="button">Actualizar método de pago →</a>
      </div>
      <p style="font-size: 13px; color: #6b7280; text-align: center;">¿Crees que es un error? <a href="mailto:soporte@misautonomos.es" style="color: #3b82f6;">Contacta con soporte</a></p>
    </div>
    <div class="footer">
      <strong style="color: #fff;">MisAutónomos</strong> · <a href="https://misautonomos.es">misautonomos.es</a>
    </div>
  </div>
</body>
</html>
                            `,
                            from_name: "MisAutónomos"
                        });
                        console.log('📧 Email de pago fallido enviado a', user.email);
                    }
                    
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