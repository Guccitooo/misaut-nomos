import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * ✅ ELIMINACIÓN COMPLETA DE USUARIO
 * 
 * Puede ser llamada por:
 * - Administrador desde el panel
 * - El propio usuario (autoeliminación)
 * 
 * Elimina:
 * - Perfil profesional
 * - Suscripción (cancela en Stripe)
 * - Favoritos
 * - Mensajes
 * - Reseñas
 * - Usuario
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticación
        const authUser = await base44.auth.me();
        if (!authUser) {
            return Response.json({ 
                ok: false, 
                error: 'No autenticado' 
            }, { status: 401 });
        }

        const { userId, isSelfDelete } = await req.json();

        // Verificar permisos
        if (!userId) {
            return Response.json({
                ok: false,
                error: 'userId requerido'
            }, { status: 400 });
        }

        // Si no es admin, solo puede eliminar su propia cuenta
        if (authUser.role !== 'admin' && authUser.id !== userId) {
            return Response.json({
                ok: false,
                error: 'No tienes permiso para eliminar esta cuenta'
            }, { status: 403 });
        }

        console.log('🗑️ ========== INICIANDO ELIMINACIÓN COMPLETA ==========');
        console.log('🗑️ Usuario ID:', userId);
        console.log('🗑️ Tipo:', isSelfDelete ? 'Autoeliminación' : 'Admin');

        // 1. Buscar usuario
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        if (users.length === 0) {
            return Response.json({
                ok: false,
                error: 'Usuario no encontrado'
            }, { status: 404 });
        }

        const targetUser = users[0];
        console.log('👤 Usuario encontrado:', targetUser.email);
        
        const deletedItems = [];

        // 2. ✅ Cancelar suscripción en Stripe PRIMERO
        console.log('\n💳 PASO 1: Cancelando suscripción Stripe...');
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            user_id: userId
        });

        if (subscriptions.length > 0 && subscriptions[0].stripe_subscription_id) {
            try {
                await stripe.subscriptions.cancel(subscriptions[0].stripe_subscription_id);
                console.log('   ✅ Suscripción Stripe cancelada inmediatamente');
                deletedItems.push('Suscripción Stripe cancelada');
            } catch (error) {
                console.log('   ⚠️ Error cancelando Stripe:', error.message);
            }
        }

        // 3. Eliminar perfil profesional
        console.log('\n📋 PASO 2: Eliminando perfil profesional...');
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: userId
        });

        for (const profile of profiles) {
            console.log(`   → Eliminando perfil: ${profile.business_name}`);
            await base44.asServiceRole.entities.ProfessionalProfile.delete(profile.id);
            deletedItems.push(`Perfil: ${profile.business_name}`);
        }
        console.log(`   ✅ ${profiles.length} perfil(es) eliminado(s)`);

        // 4. Eliminar suscripción de BD
        console.log('\n📊 PASO 3: Eliminando suscripción BD...');
        for (const sub of subscriptions) {
            await base44.asServiceRole.entities.Subscription.delete(sub.id);
            deletedItems.push('Suscripción BD');
        }
        console.log(`   ✅ ${subscriptions.length} suscripción(es) eliminada(s)`);

        // 5. Eliminar favoritos
        console.log('\n❤️ PASO 4: Eliminando favoritos...');
        const clientFavorites = await base44.asServiceRole.entities.Favorite.filter({
            client_id: userId
        });
        const professionalFavorites = await base44.asServiceRole.entities.Favorite.filter({
            professional_id: userId
        });

        for (const fav of [...clientFavorites, ...professionalFavorites]) {
            await base44.asServiceRole.entities.Favorite.delete(fav.id);
        }
        
        const totalFavorites = clientFavorites.length + professionalFavorites.length;
        console.log(`   ✅ ${totalFavorites} favorito(s) eliminado(s)`);
        if (totalFavorites > 0) deletedItems.push(`${totalFavorites} Favoritos`);

        // 6. Eliminar mensajes
        console.log('\n💬 PASO 5: Eliminando mensajes...');
        const sentMessages = await base44.asServiceRole.entities.Message.filter({
            sender_id: userId
        });
        const receivedMessages = await base44.asServiceRole.entities.Message.filter({
            recipient_id: userId
        });

        for (const msg of [...sentMessages, ...receivedMessages]) {
            await base44.asServiceRole.entities.Message.delete(msg.id);
        }

        const totalMessages = sentMessages.length + receivedMessages.length;
        console.log(`   ✅ ${totalMessages} mensaje(s) eliminado(s)`);
        if (totalMessages > 0) deletedItems.push(`${totalMessages} Mensajes`);

        // 7. Eliminar configuración de facturación
        console.log('\n🧾 PASO 6a: Eliminando datos de facturación...');
        try {
            const invoicingSettings = await base44.asServiceRole.entities.InvoicingSettings.filter({ professional_id: userId });
            for (const s of invoicingSettings) {
                await base44.asServiceRole.entities.InvoicingSettings.delete(s.id);
            }
            console.log(`   ✅ ${invoicingSettings.length} ajuste(s) de facturación eliminado(s)`);
            if (invoicingSettings.length > 0) deletedItems.push('Datos de facturación');
        } catch (error) {
            console.log('   ⚠️ Error eliminando facturación:', error.message);
        }

        // 8. Eliminar reseñas
        console.log('\n⭐ PASO 6b: Eliminando reseñas...');
        const clientReviews = await base44.asServiceRole.entities.Review.filter({
            client_id: userId
        });
        const professionalReviews = await base44.asServiceRole.entities.Review.filter({
            professional_id: userId
        });

        for (const review of [...clientReviews, ...professionalReviews]) {
            await base44.asServiceRole.entities.Review.delete(review.id);
        }

        const totalReviews = clientReviews.length + professionalReviews.length;
        console.log(`   ✅ ${totalReviews} reseña(s) eliminada(s)`);
        if (totalReviews > 0) deletedItems.push(`${totalReviews} Reseñas`);

        // 8. ✅ Eliminar el registro User
        console.log('\n👤 PASO 7: Eliminando registro de usuario...');
        try {
            await base44.asServiceRole.entities.User.delete(userId);
            console.log('   ✅ Usuario eliminado de BD');
            deletedItems.push('Usuario');
        } catch (error) {
            console.error('   ❌ Error eliminando usuario:', error.message);
            return Response.json({
                ok: false,
                error: 'No se pudo eliminar el registro del usuario',
                details: error.message
            }, { status: 500 });
        }

        // 9. ✅ Ejecutar limpieza automática de huérfanos
        console.log('\n🧹 PASO 8: Limpieza automática de datos huérfanos...');
        try {
            await base44.asServiceRole.functions.invoke('cleanOrphanData');
            console.log('   ✅ Limpieza automática ejecutada');
        } catch (error) {
            console.log('   ⚠️ Error en limpieza automática:', error.message);
        }

        console.log('\n✅ ========== ELIMINACIÓN COMPLETADA ==========\n');
        
        return Response.json({
            ok: true,
            message: isSelfDelete 
                ? `Tu cuenta ha sido eliminada completamente` 
                : `Usuario ${targetUser.email} eliminado completamente`,
            deleted_items: deletedItems,
            warning: !isSelfDelete ? '⚠️ IMPORTANTE: Debes eliminar la cuenta de autenticación manualmente desde Base44 Dashboard → Users' : null,
            next_step: !isSelfDelete ? `Ve a Base44 Dashboard y elimina el usuario con email: ${targetUser.email}` : null
        });

    } catch (error) {
        console.error('❌ Error eliminando usuario:', error);
        return Response.json({
            ok: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});