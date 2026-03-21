import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticación de admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ 
                ok: false, 
                error: 'Acceso denegado - solo administradores' 
            }, { status: 403 });
        }

        const { userId, days } = await req.json();

        if (!userId || !days) {
            return Response.json({
                ok: false,
                error: 'userId y days requeridos'
            }, { status: 400 });
        }

        console.log(`⏰ Extendiendo prueba ${days} días para usuario:`, userId);

        // 1. Buscar suscripción
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            user_id: userId
        });

        if (subscriptions.length === 0) {
            return Response.json({
                ok: false,
                error: 'No se encontró suscripción para este usuario'
            }, { status: 404 });
        }

        const subscription = subscriptions[0];

        // 2. Calcular nueva fecha de expiración
        const currentExpiration = new Date(subscription.fecha_expiracion);
        const newExpiration = new Date(currentExpiration);
        newExpiration.setDate(newExpiration.getDate() + days);

        // 3. Actualizar suscripción
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
            fecha_expiracion: newExpiration.toISOString(),
            estado: 'en_prueba'
        });

        // 4. Actualizar usuario
        await base44.asServiceRole.entities.User.update(userId, {
            subscription_status: 'en_prueba',
            subscription_end_date: newExpiration.toISOString().split('T')[0]
        });

        // 5. Asegurar que el perfil esté visible
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: userId
        });

        if (profiles.length > 0) {
            await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                visible_en_busqueda: true,
                estado_perfil: 'activo'
            });
        }

        // 6. Buscar usuario para enviar email
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        const targetUser = users[0];

        // 7. Enviar email de confirmación con HTML visual
        const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';
        
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: targetUser.email,
            subject: '🎁 Tu periodo de prueba ha sido extendido - MisAutónomos',
            body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prueba Extendida</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="MisAutónomos" style="width: 60px; height: 60px; border-radius: 12px; margin-bottom: 16px;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎁 ¡Buenas noticias!</h1>
              <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 16px;">Tu prueba ha sido extendida</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">
                Hola <strong>${targetUser.full_name || 'profesional'}</strong>,
              </p>
              
              <!-- Highlight Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; margin: 20px 0;">
                <tr>
                  <td style="padding: 24px; border-left: 4px solid #10b981;">
                    <h3 style="color: #047857; margin: 0 0 8px 0; font-size: 20px;">✨ +${days} días adicionales</h3>
                    <p style="color: #065f46; margin: 0; font-size: 16px;">
                      Nueva fecha de expiración: <strong>${newExpiration.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 16px; color: #374151; margin: 20px 0;">
                Durante este periodo extendido disfrutas de:
              </p>
              
              <!-- Benefits List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 14px;">✓</span>
                        </td>
                        <td style="font-size: 15px; color: #374151; padding-left: 12px;">
                          <strong>Perfil visible</strong> en todas las búsquedas
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 14px;">✓</span>
                        </td>
                        <td style="font-size: 15px; color: #374151; padding-left: 12px;">
                          <strong>Contactos ilimitados</strong> de clientes interesados
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 14px;">✓</span>
                        </td>
                        <td style="font-size: 15px; color: #374151; padding-left: 12px;">
                          <strong>Acceso completo</strong> a todas las herramientas
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://misautonomos.es/ProfessionalDashboard" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">
                      Ver mi panel →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #ffffff; font-weight: 600; margin: 0 0 8px 0; font-size: 16px;">MisAutónomos</p>
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                <a href="https://misautonomos.es" style="color: #60a5fa; text-decoration: none;">misautonomos.es</a>
                &nbsp;·&nbsp;
                <a href="mailto:soporte@misautonomos.es" style="color: #60a5fa; text-decoration: none;">soporte@misautonomos.es</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
            from_name: 'MisAutónomos'
        });

        console.log('✅ Prueba extendida correctamente');

        return Response.json({
            ok: true,
            message: `Prueba extendida ${days} días correctamente`,
            new_expiration: newExpiration.toISOString(),
            new_expiration_formatted: newExpiration.toLocaleDateString('es-ES')
        });

    } catch (error) {
        console.error('❌ Error extendiendo prueba:', error);
        return Response.json({
            ok: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});