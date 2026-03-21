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

        const { userId, suspend } = await req.json();

        if (!userId) {
            return Response.json({
                ok: false,
                error: 'userId requerido'
            }, { status: 400 });
        }

        console.log(`${suspend ? '🔒' : '🔓'} ${suspend ? 'Suspendiendo' : 'Reactivando'} usuario:`, userId);

        // 1. Buscar usuario
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        if (users.length === 0) {
            return Response.json({
                ok: false,
                error: 'Usuario no encontrado'
            }, { status: 404 });
        }

        const targetUser = users[0];

        // 2. Actualizar estado de suscripción
        const newStatus = suspend ? 'suspendu' : 'actif';
        
        await base44.asServiceRole.entities.User.update(userId, {
            subscription_status: newStatus
        });

        console.log('✅ Usuario actualizado con estado:', newStatus);

        // 3. Ocultar/mostrar perfil profesional
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: userId
        });

        if (profiles.length > 0) {
            await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                visible_en_busqueda: !suspend,
                estado_perfil: suspend ? 'suspendido' : 'activo'
            });
            console.log(`✅ Perfil profesional ${suspend ? 'oculto' : 'visible'}`);
        }

        // 4. Actualizar suscripción
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            user_id: userId
        });

        if (subscriptions.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
                estado: suspend ? 'suspendu' : 'actif'
            });
            console.log('✅ Suscripción actualizada');
        }

        // 5. Enviar email de notificación
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: targetUser.email,
            subject: suspend 
                ? '⚠️ Tu cuenta ha sido suspendida - milautonomos'
                : '✅ Tu cuenta ha sido reactivada - milautonomos',
            body: suspend 
                ? `Hola ${targetUser.full_name || ''},

Tu cuenta de milautonomos ha sido suspendida temporalmente.

Durante este periodo:
- No aparecerás en las búsquedas
- No podrás recibir nuevos contactos
- Tu perfil no será visible

Si crees que esto es un error, por favor contacta con soporte.

Equipo milautonomos`
                : `Hola ${targetUser.full_name || ''},

Tu cuenta de milautonomos ha sido reactivada correctamente.

Ahora:
- Tu perfil vuelve a ser visible en las búsquedas
- Puedes recibir contactos de clientes
- Todas las funcionalidades están restauradas

¡Bienvenido de nuevo!

Equipo milautonomos`,
            from_name: 'milautonomos'
        });

        console.log('✅ Email de notificación enviado');

        return Response.json({
            ok: true,
            message: `Usuario ${suspend ? 'suspendido' : 'reactivado'} correctamente`,
            new_status: newStatus
        });

    } catch (error) {
        console.error('❌ Error cambiando estado de usuario:', error);
        return Response.json({
            ok: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});