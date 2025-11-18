import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Función de limpieza: Elimina completamente usuarios marcados como "eliminado"
 * Esto es útil si algunos usuarios quedaron con estado "eliminado" en vez de eliminarse completamente
 */

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

        console.log('🧹 Iniciando limpieza de usuarios eliminados...');

        // 1. Buscar usuarios con estado "eliminado" o nombre "[ELIMINADO]"
        const allUsers = await base44.asServiceRole.entities.User.list();
        
        const deletedUsers = allUsers.filter(u => 
            u.subscription_status === 'eliminado' || 
            u.full_name?.startsWith('[ELIMINADO]')
        );

        console.log(`📊 Usuarios a limpiar: ${deletedUsers.length}`);

        const cleanedUsers = [];

        for (const u of deletedUsers) {
            try {
                console.log(`🗑️ Eliminando: ${u.email}`);
                
                // Eliminar perfil profesional
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: u.id
                });
                for (const profile of profiles) {
                    await base44.asServiceRole.entities.ProfessionalProfile.delete(profile.id);
                }

                // Eliminar suscripción
                const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
                    user_id: u.id
                });
                for (const sub of subscriptions) {
                    await base44.asServiceRole.entities.Subscription.delete(sub.id);
                }

                // Eliminar favoritos
                const favorites = await base44.asServiceRole.entities.Favorite.filter({
                    client_id: u.id
                });
                for (const fav of favorites) {
                    await base44.asServiceRole.entities.Favorite.delete(fav.id);
                }

                const professionalFavorites = await base44.asServiceRole.entities.Favorite.filter({
                    professional_id: u.id
                });
                for (const fav of professionalFavorites) {
                    await base44.asServiceRole.entities.Favorite.delete(fav.id);
                }

                // Eliminar mensajes
                const sentMessages = await base44.asServiceRole.entities.Message.filter({
                    sender_id: u.id
                });
                for (const msg of sentMessages) {
                    await base44.asServiceRole.entities.Message.delete(msg.id);
                }

                const receivedMessages = await base44.asServiceRole.entities.Message.filter({
                    recipient_id: u.id
                });
                for (const msg of receivedMessages) {
                    await base44.asServiceRole.entities.Message.delete(msg.id);
                }

                // Eliminar reseñas
                const clientReviews = await base44.asServiceRole.entities.Review.filter({
                    client_id: u.id
                });
                for (const review of clientReviews) {
                    await base44.asServiceRole.entities.Review.delete(review.id);
                }

                const professionalReviews = await base44.asServiceRole.entities.Review.filter({
                    professional_id: u.id
                });
                for (const review of professionalReviews) {
                    await base44.asServiceRole.entities.Review.delete(review.id);
                }

                // Eliminar usuario
                await base44.asServiceRole.entities.User.delete(u.id);
                
                console.log(`✅ Usuario ${u.email} eliminado completamente`);
                cleanedUsers.push(u.email);
            } catch (error) {
                console.error(`❌ Error eliminando ${u.email}:`, error.message);
            }
        }

        return Response.json({
            ok: true,
            message: `Limpieza completada: ${cleanedUsers.length} usuarios eliminados`,
            cleaned_users: cleanedUsers
        });

    } catch (error) {
        console.error('❌ Error en limpieza:', error);
        return Response.json({
            ok: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});