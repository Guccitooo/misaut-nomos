import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 🔥 FUNCIÓN DE EMERGENCIA: Activa manualmente un perfil verificando pagos
 * Usar cuando un perfil con pago confirmado no aparece visible
 */

Deno.serve(async (req) => {
    console.log('🚨 ========== ACTIVACIÓN FORZADA DE PERFIL ==========');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar que sea admin
        const admin = await base44.auth.me();
        if (!admin || admin.role !== 'admin') {
            return Response.json({ error: 'Solo administradores' }, { status: 403 });
        }

        const { user_email } = await req.json();
        
        if (!user_email) {
            return Response.json({ error: 'Falta user_email' }, { status: 400 });
        }

        console.log('📧 Buscando usuario:', user_email);

        // 1. Buscar usuario
        const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
        if (users.length === 0) {
            return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const user = users[0];
        console.log('✅ Usuario encontrado:', user.id);

        // 2. Verificar pagos
        const payments = await base44.asServiceRole.entities.PaymentRecord.filter({ user_id: user.id });
        const successPayments = payments.filter(p => p.status === 'succeeded');
        
        console.log(`💰 Pagos exitosos: ${successPayments.length}`);

        if (successPayments.length === 0) {
            return Response.json({ 
                error: 'No hay pagos registrados para este usuario',
                user_id: user.id,
                payments_count: payments.length
            }, { status: 400 });
        }

        // 3. Buscar perfil
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: user.id });
        if (profiles.length === 0) {
            return Response.json({ error: 'Perfil no encontrado' }, { status: 404 });
        }

        const profile = profiles[0];
        console.log(`📋 Perfil encontrado:`, {
            business_name: profile.business_name,
            onboarding_completed: profile.onboarding_completed,
            visible_en_busqueda: profile.visible_en_busqueda
        });

        // 4. Verificar onboarding
        if (!profile.onboarding_completed) {
            return Response.json({
                error: 'Onboarding no completado',
                profile_id: profile.id,
                onboarding_completed: false
            }, { status: 400 });
        }

        // 5. FORZAR ACTIVACIÓN
        await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
            visible_en_busqueda: true,
            estado_perfil: 'activo'
        });

        // 6. Actualizar usuario
        await base44.asServiceRole.entities.User.update(user.id, {
            user_type: 'professionnel',
            subscription_status: 'activo'
        });

        console.log('🔥 PERFIL ACTIVADO MANUALMENTE');

        return Response.json({
            success: true,
            message: 'Perfil activado exitosamente',
            user_id: user.id,
            profile_id: profile.id,
            payments_count: successPayments.length,
            total_paid: successPayments.reduce((sum, p) => sum + p.amount, 0),
            profile_status: {
                visible_en_busqueda: true,
                estado_perfil: 'activo',
                onboarding_completed: true
            }
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});