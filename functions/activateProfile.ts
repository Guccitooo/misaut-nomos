import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Función para activar/sincronizar el perfil de un autónomo
 * Se llama después del pago o al completar onboarding
 * Garantiza que el perfil sea visible si tiene suscripción activa + onboarding completo
 */

Deno.serve(async (req) => {
    console.log('🔄 ========== ACTIVAR PERFIL ==========');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticación
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        console.log('👤 Usuario:', user.id, user.email);

        // 1. Obtener suscripción del usuario
        const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: user.id });
        
        let hasActiveSubscription = false;
        let subscriptionStatus = 'sin_suscripcion';
        
        if (subs.length > 0) {
            const sub = subs[0];
            const estado = sub.estado?.toLowerCase();
            const fechaExp = new Date(sub.fecha_expiracion);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            fechaExp.setHours(0, 0, 0, 0);
            
            console.log('📊 Suscripción encontrada:', estado, 'Expira:', fechaExp.toISOString());
            
            // Verificar si suscripción es válida
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
            
            hasActiveSubscription = isActive || isCanceledButValid;
            subscriptionStatus = hasActiveSubscription ? 'activa' : 'expirada';
            
            console.log('✅ Suscripción válida:', hasActiveSubscription);
        }

        // 2. Obtener perfil profesional
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: user.id });
        
        let profileStatus = {
            exists: false,
            onboarding_completed: false,
            visible: false,
            profile_id: null
        };

        if (profiles.length > 0) {
            const profile = profiles[0];
            profileStatus = {
                exists: true,
                onboarding_completed: profile.onboarding_completed === true,
                visible: profile.visible_en_busqueda === true,
                profile_id: profile.id
            };
            
            console.log('📋 Perfil encontrado:', profileStatus);
        }

        // 3. Determinar si debe ser visible
        const shouldBeVisible = hasActiveSubscription && profileStatus.onboarding_completed;
        
        console.log('🎯 ¿Debe ser visible?', shouldBeVisible, 
            '(suscripción:', hasActiveSubscription, 
            ', onboarding:', profileStatus.onboarding_completed, ')');

        // 4. Actualizar perfil si existe
        let updated = false;
        if (profileStatus.exists && profileStatus.profile_id) {
            // Solo actualizar si hay cambio
            if (profileStatus.visible !== shouldBeVisible) {
                await base44.asServiceRole.entities.ProfessionalProfile.update(profileStatus.profile_id, {
                    visible_en_busqueda: shouldBeVisible,
                    estado_perfil: shouldBeVisible ? 'activo' : 'inactivo'
                });
                updated = true;
                console.log('✅ Perfil actualizado - visible:', shouldBeVisible);
            }
        }

        // 5. Actualizar user_type si tiene suscripción activa
        if (hasActiveSubscription && user.user_type !== 'professionnel') {
            await base44.asServiceRole.entities.User.update(user.id, {
                user_type: 'professionnel'
            });
            console.log('✅ user_type actualizado a professionnel');
        }

        // 6. Preparar respuesta
        const result = {
            success: true,
            user_id: user.id,
            subscription: {
                status: subscriptionStatus,
                active: hasActiveSubscription
            },
            profile: {
                exists: profileStatus.exists,
                onboarding_completed: profileStatus.onboarding_completed,
                visible: shouldBeVisible,
                updated: updated
            },
            message: shouldBeVisible 
                ? '✅ Perfil visible para clientes' 
                : hasActiveSubscription 
                    ? '⚠️ Completa el onboarding para ser visible'
                    : '⚠️ Activa tu suscripción para ser visible'
        };

        console.log('📤 Resultado:', result);
        return Response.json(result);

    } catch (error) {
        console.error('❌ Error:', error.message);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});