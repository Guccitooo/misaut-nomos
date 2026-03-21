
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ✅ Función universal para crear notificaciones
 * 
 * Uso:
 * await base44.functions.invoke('createNotification', {
 *   userId: 'user123',
 *   type: 'new_message',
 *   title: 'Nuevo mensaje',
 *   message: 'Has recibido un mensaje de Juan',
 *   link: '/Messages?conversation=conv123',
 *   sendEmail: true
 * });
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const {
            userId,
            type,
            title,
            message,
            link = null,
            metadata = {},
            priority = 'medium',
            sendEmail = false,
            emailSubject = null, // Value from request body, might be null
            emailBody = null     // Value from request body, might be null
        } = body;

        // Validación
        if (!userId || !type || !title || !message) {
            return Response.json({
                ok: false,
                error: 'userId, type, title y message son obligatorios'
            }, { status: 400 });
        }

        console.log('📬 Creando notificación:', {
            userId,
            type,
            title
        });

        // 1. Crear notificación in-app
        const notification = await base44.asServiceRole.entities.Notification.create({
            user_id: userId,
            type,
            title,
            message,
            link,
            metadata,
            priority,
            is_read: false
        });

        console.log('✅ Notificación creada:', notification.id);

        // Fetch user data early if email sending is contemplated, to have `user` available for templating
        let user = null;
        if (sendEmail) {
            try {
                const users = await base44.asServiceRole.entities.User.filter({ id: userId });
                if (users.length > 0) {
                    user = users[0];
                }
            } catch (userFetchError) {
                console.error('⚠️ Error fetching user for email (non-blocking):', userFetchError);
            }
        }

        // 2. Enviar email si se solicitó y el usuario fue encontrado con email
        if (sendEmail && user && user.email) {
            try {
                const finalEmailSubject = emailSubject || title; // Use emailSubject from body if provided, else notification title

                const finalEmailBody = emailBody || `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-box h3 { color: #1e40af; margin: 0 0 10px 0; font-size: 18px; }
    .info-box p { color: #1e3a8a; margin: 0; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔔</div>
      <h1>${title}</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola ${user.full_name || user.email},</p>
      
      <div class="info-box">
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
      
      ${link ? `
      <div class="cta">
        <a href="https://misautonomos.es${link}" class="button">
          Ver más detalles →
        </a>
      </div>
      ` : ''}
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        ¿Necesitas ayuda? Escríbenos a:<br/>
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
                `;

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    subject: finalEmailSubject,
                    body: finalEmailBody,
                    from_name: "Misautónomos"
                });
                console.log('📧 Email enviado a:', user.email);
            } catch (emailError) {
                console.error('⚠️ Error enviando email (no bloqueante):', emailError);
            }
        }

        return Response.json({
            ok: true,
            notification
        });

    } catch (error) {
        console.error('❌ Error creando notificación:', error);
        return Response.json({
            ok: false,
            error: error.message
        }, { status: 500 });
    }
});
