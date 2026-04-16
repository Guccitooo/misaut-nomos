
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
            emailSubject = null,
            emailBody = null
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

        // 2. Enviar email si se solicitó
        if (sendEmail) {
            try {
                const users = await base44.asServiceRole.entities.User.filter({ id: userId });
                const user = users[0];

                if (user && user.email) {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: user.email,
                        subject: emailSubject || title,
                        body: emailBody || message,
                        from_name: 'Misautónomos'
                    });
                    console.log('📧 Email enviado a:', user.email);
                }
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
