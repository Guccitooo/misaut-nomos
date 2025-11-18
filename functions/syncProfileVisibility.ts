import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 🔧 FUNCIÓN ADMIN: Sincronizar visibilidad de perfiles con estado de suscripciones
 * 
 * Esta función corrige inconsistencias entre el estado de las suscripciones
 * y la visibilidad de los perfiles profesionales.
 * 
 * Lógica correcta:
 * - Si suscripción está "cancelado" PERO aún está en periodo vigente → Perfil VISIBLE
 * - Si suscripción está "en_prueba" y fecha > hoy → Perfil VISIBLE
 * - Si suscripción está "activo" y fecha > hoy → Perfil VISIBLE
 * - Solo ocultar cuando: finalizada O (cancelado/trialing + expirado)
 */

Deno.serve(async (req) => {
    try {
        console.log('🔧 ========== SINCRONIZACIÓN DE PERFILES ==========');
        
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticación admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Obtener todas las suscripciones
        const subscriptions = await base44.asServiceRole.entities.Subscription.list();
        console.log(`📊 Suscripciones totales: ${subscriptions.length}`);
        
        let correctedCount = 0;
        let alreadyCorrectCount = 0;
        const corrections = [];
        
        for (const subscription of subscriptions) {
            console.log(`\n👤 Usuario: ${subscription.user_id}`);
            console.log(`   Plan: ${subscription.plan_nombre}`);
            console.log(`   Estado suscripción: ${subscription.estado}`);
            console.log(`   Fecha expiración: ${subscription.fecha_expiracion}`);
            
            // Calcular si debe estar visible
            const expirationDate = new Date(subscription.fecha_expiracion);
            expirationDate.setHours(0, 0, 0, 0);
            const isStillInPeriod = expirationDate >= today;
            
            const normalizedState = subscription.estado?.toLowerCase().trim();
            const validActiveStates = ["activo", "active", "en_prueba", "trialing", "cancelado", "canceled"];
            
            const shouldBeVisible = validActiveStates.includes(normalizedState) && isStillInPeriod;
            
            console.log(`   ¿Periodo vigente?: ${isStillInPeriod}`);
            console.log(`   ¿Debe estar visible?: ${shouldBeVisible}`);
            
            // Buscar perfil
            const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                user_id: subscription.user_id
            });
            
            if (profiles.length === 0) {
                console.log('   ⚠️ Sin perfil profesional');
                continue;
            }
            
            const profile = profiles[0];
            console.log(`   Estado perfil actual: ${profile.estado_perfil}`);
            console.log(`   Visibilidad actual: ${profile.visible_en_busqueda}`);
            
            // Verificar si necesita corrección
            const needsCorrection = 
                profile.visible_en_busqueda !== shouldBeVisible ||
                (shouldBeVisible && profile.estado_perfil !== 'activo') ||
                (!shouldBeVisible && profile.estado_perfil !== 'inactivo');
            
            if (needsCorrection) {
                console.log('   🔧 CORRIGIENDO...');
                
                await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                    visible_en_busqueda: shouldBeVisible,
                    estado_perfil: shouldBeVisible ? 'activo' : 'inactivo'
                });
                
                // Actualizar usuario
                await base44.asServiceRole.entities.User.update(subscription.user_id, {
                    subscription_status: subscription.estado
                });
                
                correctedCount++;
                corrections.push({
                    user_id: subscription.user_id,
                    business_name: profile.business_name,
                    subscription_state: subscription.estado,
                    was_visible: profile.visible_en_busqueda,
                    now_visible: shouldBeVisible,
                    expiration: subscription.fecha_expiracion
                });
                
                console.log(`   ✅ CORREGIDO: visible=${shouldBeVisible}, estado=${shouldBeVisible ? 'activo' : 'inactivo'}`);
            } else {
                console.log('   ✓ Ya correcto');
                alreadyCorrectCount++;
            }
        }
        
        console.log('\n📊 ========== RESUMEN ==========');
        console.log(`   Total revisados: ${subscriptions.length}`);
        console.log(`   Corregidos: ${correctedCount}`);
        console.log(`   Ya correctos: ${alreadyCorrectCount}`);
        
        if (corrections.length > 0) {
            console.log('\n🔧 CORRECCIONES REALIZADAS:');
            corrections.forEach(c => {
                console.log(`   - ${c.business_name || c.user_id}: ${c.was_visible ? 'Visible' : 'Oculto'} → ${c.now_visible ? 'Visible' : 'Oculto'} (estado: ${c.subscription_state}, expira: ${c.expiration})`);
            });
        }
        
        return Response.json({
            ok: true,
            timestamp: new Date().toISOString(),
            stats: {
                total_checked: subscriptions.length,
                corrected: correctedCount,
                already_correct: alreadyCorrectCount
            },
            corrections: corrections
        });
        
    } catch (error) {
        console.error('❌ Error sincronizando perfiles:', error);
        return Response.json({
            ok: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});