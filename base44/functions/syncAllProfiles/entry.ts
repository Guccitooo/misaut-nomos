import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * ✅ FUNCIÓN GLOBAL: Sincroniza TODOS los perfiles según sus suscripciones
 * 
 * Reglas:
 * 1. Solo visible si: onboarding_completed=true Y suscripción activa
 * 2. User_type=professionnel solo si tiene suscripción activa
 * 3. Si no tiene suscripción o está expirada -> visible_en_busqueda=false
 */

Deno.serve(async (req) => {
    console.log('🔄 ========== SINCRONIZAR TODOS LOS PERFILES ==========');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar que sea admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Solo administradores pueden ejecutar esta función' }, { status: 403 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Obtener todas las suscripciones
        const allSubscriptions = await base44.asServiceRole.entities.Subscription.list();
        console.log(`📋 Total suscripciones: ${allSubscriptions.length}`);

        // 🔥 NUEVO: Verificar pagos recientes (últimos 35 días)
        const allPayments = await base44.asServiceRole.entities.PaymentRecord.list();
        const recentPayments = new Map();
        const thirtyFiveDaysAgo = new Date(today);
        thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);

        allPayments.forEach(payment => {
            const paymentDate = new Date(payment.payment_date);
            const periodEnd = new Date(payment.period_end);
            
            // Si el pago fue exitoso Y el período aún no ha expirado
            if (payment.status === 'succeeded' && periodEnd >= today) {
                recentPayments.set(payment.user_id, payment);
            }
        });
        console.log(`💰 Usuarios con pagos válidos: ${recentPayments.size}`);

        // Crear mapa de suscripciones activas por user_id
        const activeSubscriptions = new Map();
        allSubscriptions.forEach(sub => {
            const estado = sub.estado?.toLowerCase();
            const fechaExp = new Date(sub.fecha_expiracion);
            fechaExp.setHours(0, 0, 0, 0);
            
            const isActive = (
                estado === 'activo' || 
                estado === 'active' || 
                estado === 'en_prueba' || 
                estado === 'trialing' || 
                estado === 'trial_active'
            ) && fechaExp >= today;
            
            const isCanceledButValid = (
                estado === 'cancelado' || 
                estado === 'canceled'
            ) && fechaExp >= today;
            
            if (isActive || isCanceledButValid) {
                activeSubscriptions.set(sub.user_id, sub);
            }
        });
        console.log(`✅ Suscripciones activas: ${activeSubscriptions.size}`);

        // 2. Obtener todos los perfiles
        const allProfiles = await base44.asServiceRole.entities.ProfessionalProfile.list();
        console.log(`📋 Total perfiles: ${allProfiles.length}`);

        const results = {
            total: allProfiles.length,
            activated: 0,
            deactivated: 0,
            unchanged: 0,
            usersUpdated: 0,
            errors: []
        };

        // 3. Sincronizar cada perfil (basado en PAGOS, no solo suscripciones)
        for (const profile of allProfiles) {
            try {
                const hasActiveSubscription = activeSubscriptions.has(profile.user_id);
                const hasRecentPayment = recentPayments.has(profile.user_id);
                
                // 🔥 NUEVA LÓGICA: Visible si tiene pago válido O suscripción activa
                const shouldBeVisible = (hasRecentPayment || hasActiveSubscription) && profile.onboarding_completed === true;
                
                // Solo actualizar si hay cambio
                if (profile.visible_en_busqueda !== shouldBeVisible) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                        visible_en_busqueda: shouldBeVisible,
                        estado_perfil: shouldBeVisible ? 'activo' : 'inactivo'
                    });
                    
                    if (shouldBeVisible) {
                        results.activated++;
                        console.log(`✅ ACTIVADO: ${profile.business_name} (${profile.user_id}) - Pago: ${hasRecentPayment}, Sub: ${hasActiveSubscription}`);
                    } else {
                        results.deactivated++;
                        console.log(`❌ DESACTIVADO: ${profile.business_name} (${profile.user_id}) - Sin pago/suscripción válidos`);
                    }
                } else {
                    results.unchanged++;
                }

                // 4. Actualizar user_type según suscripción
                if (hasActiveSubscription && profile.onboarding_completed) {
                    try {
                        await base44.asServiceRole.entities.User.update(profile.user_id, {
                            user_type: 'professionnel'
                        });
                        results.usersUpdated++;
                    } catch (userErr) {
                        console.log(`⚠️ No se pudo actualizar user_type para ${profile.user_id}: ${userErr.message}`);
                    }
                }

            } catch (err) {
                results.errors.push({
                    profile_id: profile.id,
                    business_name: profile.business_name,
                    error: err.message
                });
                console.error(`❌ Error con perfil ${profile.business_name}: ${err.message}`);
            }
        }

        console.log('\n📊 ========== RESUMEN ==========');
        console.log(`Total perfiles: ${results.total}`);
        console.log(`Activados: ${results.activated}`);
        console.log(`Desactivados: ${results.deactivated}`);
        console.log(`Sin cambios: ${results.unchanged}`);
        console.log(`Usuarios actualizados: ${results.usersUpdated}`);
        console.log(`Errores: ${results.errors.length}`);

        return Response.json({
            success: true,
            message: 'Sincronización completada',
            results
        });

    } catch (error) {
        console.error('❌ Error general:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});