import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ✅ FUNCIÓN CRON: Verificar y ocultar perfiles con suscripciones expiradas
 * 
 * Esta función debe ejecutarse diariamente (recomendado: cada 1 hora)
 * para asegurar que los perfiles con suscripciones caducadas se oculten automáticamente.
 * 
 * Lógica:
 * - Si subscription.estado === "cancelado" Y fecha_expiracion < hoy → Ocultar perfil
 * - Si subscription.estado === "en_prueba" Y fecha_expiracion < hoy → Ocultar perfil
 * - Si subscription.estado === "finalizada" → Ocultar perfil
 */

Deno.serve(async (req) => {
    try {
        console.log('⏰ Iniciando verificación de suscripciones expiradas');
        
        const base44 = createClientFromRequest(req);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Inicio del día actual
        
        // ✅ Obtener TODAS las suscripciones
        const allSubscriptions = await base44.asServiceRole.entities.Subscription.list();
        console.log(`📊 Total suscripciones: ${allSubscriptions.length}`);
        
        let hiddenCount = 0;
        let alreadyHiddenCount = 0;
        let activeCount = 0;
        
        for (const subscription of allSubscriptions) {
            const expirationDate = new Date(subscription.fecha_expiracion);
            expirationDate.setHours(0, 0, 0, 0);
            
            const isExpired = expirationDate < today;
            const shouldBeHidden = 
                subscription.estado === 'finalizada' ||
                (subscription.estado === 'cancelado' && isExpired) ||
                (subscription.estado === 'en_prueba' && isExpired);
            
            console.log(`\n🔍 Usuario: ${subscription.user_id}`);
            console.log(`   Estado: ${subscription.estado}`);
            console.log(`   Expira: ${expirationDate.toISOString().split('T')[0]}`);
            console.log(`   Hoy: ${today.toISOString().split('T')[0]}`);
            console.log(`   ¿Expirado?: ${isExpired}`);
            console.log(`   ¿Debe ocultarse?: ${shouldBeHidden}`);
            
            // Buscar perfil del usuario
            const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                user_id: subscription.user_id
            });
            
            if (profiles.length === 0) {
                console.log('   ⚠️ Sin perfil profesional');
                continue;
            }
            
            const profile = profiles[0];
            
            if (shouldBeHidden) {
                if (profile.visible_en_busqueda === true) {
                    // ✅ OCULTAR PERFIL
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                        visible_en_busqueda: false,
                        estado_perfil: 'inactivo'
                    });
                    
                    // Actualizar suscripción a finalizada
                    if (subscription.estado !== 'finalizada') {
                        await base44.asServiceRole.entities.Subscription.update(subscription.id, {
                            estado: 'finalizada'
                        });
                    }
                    
                    // Actualizar usuario
                    await base44.asServiceRole.entities.User.update(subscription.user_id, {
                        subscription_status: 'finalizada'
                    });
                    
                    console.log('   ❌ Perfil OCULTADO (suscripción expirada)');
                    hiddenCount++;
                } else {
                    console.log('   ✓ Ya estaba oculto');
                    alreadyHiddenCount++;
                }
            } else {
                // Suscripción aún válida
                if (profile.visible_en_busqueda === false) {
                    // ✅ ACTIVAR PERFIL si debería estar visible
                    const shouldBeVisible = 
                        subscription.estado === 'activo' ||
                        subscription.estado === 'en_prueba' ||
                        (subscription.estado === 'cancelado' && !isExpired);
                    
                    if (shouldBeVisible) {
                        await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                            visible_en_busqueda: true,
                            estado_perfil: 'activo'
                        });
                        
                        await base44.asServiceRole.entities.User.update(subscription.user_id, {
                            subscription_status: subscription.estado
                        });
                        
                        console.log('   ✅ Perfil ACTIVADO (suscripción válida)');
                        activeCount++;
                    }
                } else {
                    console.log('   ✓ Activo correctamente');
                    activeCount++;
                }
            }
        }
        
        console.log('\n📊 RESUMEN:');
        console.log(`   ❌ Perfiles ocultados: ${hiddenCount}`);
        console.log(`   ⚠️ Ya estaban ocultos: ${alreadyHiddenCount}`);
        console.log(`   ✅ Perfiles activos: ${activeCount}`);
        
        return Response.json({
            success: true,
            timestamp: new Date().toISOString(),
            stats: {
                total_subscriptions: allSubscriptions.length,
                newly_hidden: hiddenCount,
                already_hidden: alreadyHiddenCount,
                active: activeCount
            }
        });
        
    } catch (error) {
        console.error('❌ Error verificando suscripciones:', error);
        return Response.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});