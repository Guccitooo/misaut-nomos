import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get user data from request
        const body = await req.json();
        const { userId, selectedPlan, userData } = body;

        // Validation: userId is required
        if (!userId) {
            return Response.json({
                ok: false,
                step: "validation",
                message: 'El ID de usuario es obligatorio'
            }, { status: 400 });
        }

        // Check if user exists
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        const user = users[0];

        if (!user) {
            return Response.json({
                ok: false,
                step: "validation",
                message: 'Usuario no encontrado. Por favor, contacta con soporte.'
            }, { status: 404 });
        }

        // Validation: email is required
        if (!user.email) {
            return Response.json({
                ok: false,
                step: "validation",
                message: 'El email del usuario es obligatorio'
            }, { status: 400 });
        }

        // ✅ NUEVO: Verificar que sea profesional
        if (user.user_type !== "professionnel") {
            return Response.json({
                ok: false,
                step: "validation",
                message: 'Solo los profesionales pueden crear suscripciones'
            }, { status: 400 });
        }

        // Get plan details (default to trial)
        const planId = selectedPlan || "plan_monthly_trial";
        const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
            plan_id: planId
        });
        
        const plan = plans[0];
        if (!plan) {
            return Response.json({
                ok: false,
                step: "plan",
                message: 'Plan de suscripción no encontrado'
            }, { status: 404 });
        }

        // ✅ IMPORTANTE: SIEMPRE usar "actif" para que aparezcan en búsquedas
        await base44.asServiceRole.entities.User.update(userId, {
            subscription_status: "actif",
            user_type: "professionnel",
            subscription_start_date: new Date().toISOString().split('T')[0],
            subscription_end_date: new Date(Date.now() + plan.duracion_dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

        // Check if subscription already exists (idempotency)
        const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
            user_id: userId
        });

        let subscription;
        if (existingSubscriptions.length > 0) {
            subscription = existingSubscriptions[0];
            console.log(`✅ Suscripción ya existía para usuario ${userId}`);
        } else {
            // Create new subscription
            const now = new Date();
            const expiration = new Date(now.getTime() + plan.duracion_dias * 24 * 60 * 60 * 1000);

            subscription = await base44.asServiceRole.entities.Subscription.create({
                user_id: userId,
                plan_id: plan.plan_id,
                plan_nombre: plan.nombre,
                plan_precio: plan.precio,
                fecha_inicio: now.toISOString(),
                fecha_expiracion: expiration.toISOString(),
                estado: plan.plan_id === "plan_monthly_trial" ? "en_prueba" : "activo",
                renovacion_automatica: plan.renovacion_automatica,
                metodo_pago: "stripe",
                fecha_ultima_renovacion: now.toISOString()
            });
            console.log(`✅ Nueva suscripción creada para usuario ${userId}`);
        }

        // Check if professional profile already exists (idempotency)
        const existingProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: userId
        });

        let profile;
        if (existingProfiles.length > 0) {
            // ✅ Profile already exists - NO cambiar estado, dejar que el quiz lo haga
            profile = existingProfiles[0];
            console.log(`✅ Perfil profesional ya existe para usuario ${userId}`);
        } else {
            // ✅ Create new professional profile in PENDING state
            const fullName = userData?.fullName || user.full_name || "Nuevo autónomo";
            const activity = userData?.activity || "Sin especificar";
            const city = userData?.city || user.city || "Por definir";

            profile = await base44.asServiceRole.entities.ProfessionalProfile.create({
                user_id: userId,
                business_name: fullName,
                description: `Profesional recién registrado en Misautónomos. Completa tu perfil para aparecer en búsquedas.`,
                categories: activity !== "Sin especificar" ? [activity] : [],
                service_area: city,
                opening_hours: "A convenir",
                cif_nif: userData?.cifNif || "",
                telefono_contacto: userData?.phone || user.phone || "",
                email_contacto: user.email,
                photos: [],
                price_range: "€€",
                average_rating: 0,
                total_reviews: 0,
                website: "",
                social_links: {
                    facebook: "",
                    instagram: "",
                    linkedin: ""
                },
                estado_perfil: "pendiente",
                visible_en_busqueda: false,
                onboarding_completed: false
            });
            console.log(`✅ Nuevo perfil profesional creado en estado PENDIENTE para usuario ${userId}`);
        }

        // ✅ Send welcome email SOLO si es nuevo
        if (existingSubscriptions.length === 0) {
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    subject: `✅ ${plan.mensaje_activacion} - Completa tu perfil`,
                    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 24px; color: #1f2937; margin-bottom: 20px; font-weight: 700; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .success-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; }
    .success-box h2 { margin: 0 0 15px 0; font-size: 22px; }
    .success-box p { margin: 0; font-size: 15px; opacity: 0.95; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-box h3 { color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }
    .info-box ul { margin: 0; padding-left: 20px; color: #1e40af; }
    .info-box li { margin-bottom: 10px; line-height: 1.6; }
    .steps { background: #f9fafb; padding: 25px; margin: 25px 0; border-radius: 12px; border: 2px dashed #cbd5e1; }
    .steps h3 { color: #1f2937; margin: 0 0 15px 0; font-size: 18px; }
    .steps ol { margin: 0; padding-left: 20px; color: #4b5563; }
    .steps li { margin-bottom: 12px; line-height: 1.6; font-weight: 500; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .warning p { color: #92400e; margin: 0; font-weight: 500; }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎉</div>
      <h1>Misautónomos</h1>
      <p>Tu autónomo de confianza</p>
    </div>
    
    <div class="content">
      <p class="greeting">¡Hola ${user.full_name || user.email}!</p>
      
      <div class="success-box">
        <h2>🎉 ${plan.mensaje_activacion}</h2>
        <p>Tu suscripción está lista. Ahora completa tu perfil para empezar</p>
      </div>
      
      <div class="info-box">
        <h3>📋 Detalles de tu plan</h3>
        <ul>
          <li><strong>Plan:</strong> ${plan.nombre}</li>
          <li><strong>Precio:</strong> ${plan.precio}€</li>
          <li><strong>Duración:</strong> ${plan.duracion_dias} días</li>
          <li><strong>Fecha de inicio:</strong> ${new Date().toLocaleDateString('es-ES')}</li>
          <li><strong>Fecha de expiración:</strong> ${new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}</li>
        </ul>
      </div>
      
      ${plan.plan_id === "plan_monthly_trial" ? `
      <div class="warning">
        <p>
          <strong>🎁 PRUEBA GRATUITA DE 7 DÍAS</strong><br/>
          Al finalizar tu prueba, tu suscripción se renovará automáticamente al plan mensual (49€/mes) si no cancelas antes.
        </p>
      </div>
      ` : ''}
      
      <div class="steps">
        <h3>📝 Próximos pasos para activar tu perfil:</h3>
        <ol>
          <li>✅ Completa tu perfil profesional (5 minutos)</li>
          <li>📸 Añade fotos de tus trabajos</li>
          <li>📍 Define tu zona de trabajo</li>
          <li>💼 Añade tu descripción y tarifas</li>
          <li>🚀 ¡Tu perfil se publicará automáticamente!</li>
        </ol>
      </div>
      
      <p class="message" style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <strong style="color: #92400e;">⚠️ IMPORTANTE:</strong> 
        <span style="color: #78350f;">Tu perfil aún NO está visible en las búsquedas. Una vez completes el quiz de perfil, aparecerás automáticamente y empezarás a recibir contactos de clientes.</span>
      </p>
      
      <div class="cta">
        <a href="https://autonomosmil.es/ProfileOnboarding" class="button">
          Completar mi perfil ahora →
        </a>
      </div>
      
      <p class="message" style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
        ¿Necesitas ayuda? Escríbenos a:<br/>
        <a href="mailto:soporte@autonomosmil.es" style="color: #3b82f6; text-decoration: none;">soporte@autonomosmil.es</a>
      </p>
    </div>
    
    <div class="footer">
      <strong>Equipo Misautónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@autonomosmil.es">soporte@autonomosmil.es</a><br/>
        <a href="https://autonomosmil.es">autonomosmil.es</a>
      </p>
    </div>
  </div>
</body>
</html>
                    `,
                    from_name: "Misautónomos"
                });
                console.log(`✅ Email de bienvenida enviado a ${user.email}`);
            } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
            }
        }

        // Return success with profile data
        return Response.json({
            ok: true,
            message: 'Suscripción y perfil creados correctamente. Redirigiendo al quiz...',
            data: {
                subscription: {
                    id: subscription.id,
                    plan_id: subscription.plan_id,
                    estado: subscription.estado,
                    fecha_expiracion: subscription.fecha_expiracion
                },
                profile: {
                    id: profile.id,
                    business_name: profile.business_name,
                    user_id: profile.user_id
                }
            }
        });

    } catch (error) {
        console.error('Error in onUserCreated:', error);
        return Response.json({
            ok: false,
            step: "error",
            message: error.message || 'Error al crear la suscripción y perfil',
            details: error.toString()
        }, { status: 500 });
    }
});