import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticación
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ 
                ok: false, 
                error: 'Acceso denegado - solo administradores' 
            }, { status: 403 });
        }

        const { email } = await req.json();

        if (!email) {
            return Response.json({
                ok: false,
                error: 'Email requerido'
            }, { status: 400 });
        }

        console.log('🔧 Activando trial para:', email);

        // 1. Buscar usuario por email
        const users = await base44.asServiceRole.entities.User.filter({ email });

        if (users.length === 0) {
            return Response.json({
                ok: false,
                error: 'Usuario no encontrado'
            }, { status: 404 });
        }

        const targetUser = users[0];
        const userId = targetUser.id;

        console.log('✅ Usuario encontrado:', userId);

        // 2. Buscar si ya tiene suscripción
        const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
            user_id: userId
        });

        // 3. Buscar plan de prueba
        const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
            plan_id: 'plan_monthly_trial'
        });

        if (plans.length === 0) {
            return Response.json({
                ok: false,
                error: 'Plan de prueba no encontrado'
            }, { status: 404 });
        }

        const plan = plans[0];

        // 4. Crear fechas
        const today = new Date();
        const trialEnd = new Date(today);
        trialEnd.setDate(trialEnd.getDate() + 7); // 7 días de prueba

        // ✅ CRÍTICO: Siempre con renovación automática para trials
        const subscriptionData = {
            user_id: userId,
            plan_id: plan.plan_id,
            plan_nombre: plan.nombre,
            plan_precio: plan.precio,
            fecha_inicio: today.toISOString(),
            fecha_expiracion: trialEnd.toISOString(),
            estado: 'en_prueba',
            renovacion_automatica: true, // ✅ SIEMPRE TRUE para trials
            metodo_pago: 'manual'
        };

        // 5. Crear o actualizar suscripción
        let subscription;
        if (existingSubs.length > 0) {
            console.log('🔄 Actualizando suscripción existente');
            subscription = await base44.asServiceRole.entities.Subscription.update(
                existingSubs[0].id,
                subscriptionData
            );
        } else {
            console.log('➕ Creando nueva suscripción');
            subscription = await base44.asServiceRole.entities.Subscription.create(subscriptionData);
        }

        console.log('✅ Suscripción creada/actualizada con renovación automática:', subscription.id);

        // 6. Actualizar usuario
        await base44.asServiceRole.entities.User.update(userId, {
            user_type: 'professionnel',
            subscription_status: 'en_prueba',
            subscription_start_date: today.toISOString().split('T')[0],
            subscription_end_date: trialEnd.toISOString().split('T')[0]
        });

        console.log('✅ Usuario actualizado');

        // 7. Buscar y activar perfil profesional
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: userId
        });

        if (profiles.length > 0) {
            const profile = profiles[0];
            await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                estado_perfil: 'activo',
                visible_en_busqueda: true
            });
            console.log('✅ Perfil profesional activado');
        } else {
            console.log('⚠️ No se encontró perfil profesional');
        }

        // 8. Enviar email de confirmación
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: '✅ Tu prueba gratuita ha sido activada - Misautónomos',
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
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .warning p { color: #92400e; margin: 0; font-weight: 500; }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎁</div>
      <h1>¡Prueba activada!</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${targetUser.full_name || targetUser.email},</p>
      
      <p class="message">
        Tu periodo de prueba gratuito de <strong>7 días</strong> ha sido activado correctamente en Misautónomos.
      </p>
      
      <div class="success-box">
        <h3>✅ Tu perfil ya está activo</h3>
        <p>📍 Visible en las búsquedas de clientes</p>
        <p>💬 Listo para recibir contactos</p>
        <p>⏰ Prueba finaliza: ${trialEnd.toLocaleDateString('es-ES')}</p>
      </div>
      
      <div class="warning">
        <p>
          <strong>⚠️ IMPORTANTE:</strong> Al finalizar los 7 días de prueba, tu suscripción se renovará automáticamente al plan mensual (49€/mes) a menos que canceles antes.
        </p>
      </div>
      
      <p class="message">
        Puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario sin compromiso.
      </p>
      
      <p class="message" style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
        Si tienes alguna pregunta, contacta con nosotros:<br/>
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
            from_name: 'Misautónomos'
        });

        console.log('✅ Email de confirmación enviado');

        return Response.json({
            ok: true,
            message: `Prueba gratuita activada correctamente para ${email}`,
            subscription: {
                estado: 'en_prueba',
                renovacion_automatica: true,
                fecha_inicio: today.toISOString(),
                fecha_expiracion: trialEnd.toISOString()
            },
            profile_activated: profiles.length > 0
        });

    } catch (error) {
        console.error('❌ Error activando trial:', error);
        return Response.json({
            ok: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});