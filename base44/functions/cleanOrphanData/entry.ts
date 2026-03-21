import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ✅ LIMPIEZA AUTOMÁTICA DE DATOS HUÉRFANOS
 * 
 * Esta función se ejecuta automáticamente:
 * - Después de cada eliminación de usuario
 * - Como tarea programada diaria (cron)
 * 
 * Elimina:
 * - Perfiles sin usuario asociado
 * - Suscripciones sin usuario asociado
 * - Mensajes de usuarios inexistentes
 * - Favoritos de usuarios inexistentes
 * - Reseñas de usuarios inexistentes
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        console.log('🧹 ========== LIMPIEZA AUTOMÁTICA INICIADA ==========');
        const startTime = Date.now();

        // Obtener todos los usuarios válidos
        const allUsers = await base44.asServiceRole.entities.User.list();
        const userIds = new Set(allUsers.map(u => u.id));
        console.log(`📊 Usuarios válidos: ${userIds.size}`);

        const cleanupStats = {
            profiles: 0,
            subscriptions: 0,
            messages: 0,
            favorites: 0,
            reviews: 0
        };

        // 1️⃣ LIMPIAR PERFILES HUÉRFANOS
        console.log('\n📋 Limpiando perfiles huérfanos...');
        const allProfiles = await base44.asServiceRole.entities.ProfessionalProfile.list();
        const orphanProfiles = allProfiles.filter(p => !userIds.has(p.user_id));
        
        for (const profile of orphanProfiles) {
            try {
                await base44.asServiceRole.entities.ProfessionalProfile.delete(profile.id);
                cleanupStats.profiles++;
                console.log(`   ✅ Perfil eliminado: ${profile.business_name} (user_id: ${profile.user_id})`);
            } catch (error) {
                console.error(`   ❌ Error eliminando perfil ${profile.id}:`, error.message);
            }
        }

        // 2️⃣ LIMPIAR SUSCRIPCIONES HUÉRFANAS
        console.log('\n💳 Limpiando suscripciones huérfanas...');
        const allSubscriptions = await base44.asServiceRole.entities.Subscription.list();
        const orphanSubs = allSubscriptions.filter(s => !userIds.has(s.user_id));
        
        for (const sub of orphanSubs) {
            try {
                await base44.asServiceRole.entities.Subscription.delete(sub.id);
                cleanupStats.subscriptions++;
                console.log(`   ✅ Suscripción eliminada: user_id ${sub.user_id}`);
            } catch (error) {
                console.error(`   ❌ Error eliminando suscripción ${sub.id}:`, error.message);
            }
        }

        // 3️⃣ LIMPIAR MENSAJES HUÉRFANOS
        console.log('\n💬 Limpiando mensajes huérfanos...');
        const allMessages = await base44.asServiceRole.entities.Message.list();
        const orphanMessages = allMessages.filter(m => 
            !userIds.has(m.sender_id) || !userIds.has(m.recipient_id)
        );
        
        for (const msg of orphanMessages) {
            try {
                await base44.asServiceRole.entities.Message.delete(msg.id);
                cleanupStats.messages++;
            } catch (error) {
                console.error(`   ❌ Error eliminando mensaje ${msg.id}:`, error.message);
            }
        }

        // 4️⃣ LIMPIAR FAVORITOS HUÉRFANOS
        console.log('\n❤️ Limpiando favoritos huérfanos...');
        const allFavorites = await base44.asServiceRole.entities.Favorite.list();
        const orphanFavorites = allFavorites.filter(f => 
            !userIds.has(f.client_id) || !userIds.has(f.professional_id)
        );
        
        for (const fav of orphanFavorites) {
            try {
                await base44.asServiceRole.entities.Favorite.delete(fav.id);
                cleanupStats.favorites++;
            } catch (error) {
                console.error(`   ❌ Error eliminando favorito ${fav.id}:`, error.message);
            }
        }

        // 5️⃣ LIMPIAR RESEÑAS HUÉRFANAS
        console.log('\n⭐ Limpiando reseñas huérfanas...');
        const allReviews = await base44.asServiceRole.entities.Review.list();
        const orphanReviews = allReviews.filter(r => 
            !userIds.has(r.client_id) || !userIds.has(r.professional_id)
        );
        
        for (const review of orphanReviews) {
            try {
                await base44.asServiceRole.entities.Review.delete(review.id);
                cleanupStats.reviews++;
            } catch (error) {
                console.error(`   ❌ Error eliminando reseña ${review.id}:`, error.message);
            }
        }

        const duration = Date.now() - startTime;
        console.log('\n✅ ========== LIMPIEZA COMPLETADA ==========');
        console.log(`⏱️ Duración: ${duration}ms`);
        console.log('📊 Estadísticas:');
        console.log(`   - Perfiles eliminados: ${cleanupStats.profiles}`);
        console.log(`   - Suscripciones eliminadas: ${cleanupStats.subscriptions}`);
        console.log(`   - Mensajes eliminados: ${cleanupStats.messages}`);
        console.log(`   - Favoritos eliminados: ${cleanupStats.favorites}`);
        console.log(`   - Reseñas eliminadas: ${cleanupStats.reviews}`);
        console.log(`   - Total: ${Object.values(cleanupStats).reduce((a, b) => a + b, 0)}`);

        return Response.json({
            ok: true,
            message: 'Limpieza automática completada',
            stats: cleanupStats,
            duration_ms: duration
        });

    } catch (error) {
        console.error('❌ Error en limpieza automática:', error);
        return Response.json({
            ok: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});