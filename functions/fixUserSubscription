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

        const { email } = await req.json();

        if (!email) {
            return Response.json({
                ok: false,
                error: 'Email requerido'
            }, { status: 400 });
        }

        console.log('🔧 Corrigiendo suscripción para:', email);

        // 1. Buscar usuario
        const users = await base44.asServiceRole.entities.User.filter({ email });
        
        if (users.length === 0) {
            return Response.json({
                ok: false,
                error: 'Usuario no encontrado'
            }, { status: 404 });
        }

        const targetUser = users[0];
        const userId = targetUser.id;

        // 2. Buscar suscripción
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

        // 3. ✅ Corregir renovación automática a TRUE
        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
            renovacion_automatica: true
        });

        console.log('✅ Suscripción corregida - renovacion_automatica: true');

        // 4. Actualizar usuario
        await base44.asServiceRole.entities.User.update(userId, {
            subscription_status: subscription.estado
        });

        // 5. Asegurar que el perfil esté visible si la suscripción está activa
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: userId
        });

        if (profiles.length > 0) {
            const today = new Date();
            const expiration = new Date(subscription.fecha_expiracion);
            const isActive = expiration >= today;

            await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                visible_en_busqueda: isActive,
                estado_perfil: isActive ? 'activo' : 'inactivo'
            });
            
            console.log(`✅ Perfil profesional ${isActive ? 'activado' : 'desactivado'}`);
        }

        return Response.json({
            ok: true,
            message: `Suscripción corregida para ${email}`,
            subscription: {
                estado: subscription.estado,
                renovacion_automatica: true,
                fecha_expiracion: subscription.fecha_expiracion
            }
        });

    } catch (error) {
        console.error('❌ Error corrigiendo suscripción:', error);
        return Response.json({
            ok: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});