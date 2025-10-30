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

        // 7. Enviar email de confirmación
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: targetUser.email,
            subject: '🎁 Tu periodo de prueba ha sido extendido - milautonomos',
            body: `Hola ${targetUser.full_name || ''},

¡Buenas noticias! Tu periodo de prueba en milautonomos ha sido extendido.

🎉 Extensión: ${days} días adicionales
📅 Nueva fecha de expiración: ${newExpiration.toLocaleDateString('es-ES')}

Durante este periodo extendido:
- Tu perfil sigue visible en las búsquedas
- Puedes recibir contactos de clientes sin límite
- Acceso completo a todas las funcionalidades

Si tienes alguna pregunta, no dudes en contactarnos.

Gracias,
Equipo milautonomos`,
            from_name: 'milautonomos'
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