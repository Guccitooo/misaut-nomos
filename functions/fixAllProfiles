import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all professional profiles
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.list();
        const users = await base44.asServiceRole.entities.User.list();
        
        console.log(`📦 Total perfiles: ${profiles.length}`);
        console.log(`👥 Total usuarios: ${users.length}`);
        
        const results = [];
        
        for (const profile of profiles) {
            const user = users.find(u => u.id === profile.user_id);
            
            if (!user) {
                results.push({
                    profile_id: profile.id,
                    business_name: profile.business_name,
                    status: 'error',
                    message: 'Usuario no encontrado'
                });
                continue;
            }
            
            // Check current state
            const needsUpdate = 
                !user.subscription_status || 
                user.subscription_status === 'desconocido' ||
                profile.visible_en_busqueda !== true ||
                profile.onboarding_completed !== true ||
                profile.estado_perfil !== 'activo';
            
            if (needsUpdate) {
                // Update user subscription
                await base44.asServiceRole.entities.User.update(user.id, {
                    subscription_status: "actif",
                    user_type: "professionnel",
                    subscription_start_date: new Date().toISOString().split('T')[0],
                    subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                });
                
                // Update profile
                await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                    visible_en_busqueda: true,
                    onboarding_completed: true,
                    estado_perfil: "activo"
                });
                
                results.push({
                    profile_id: profile.id,
                    business_name: profile.business_name,
                    email: user.email,
                    status: 'updated',
                    changes: {
                        subscription_status: `${user.subscription_status} → actif`,
                        visible_en_busqueda: `${profile.visible_en_busqueda} → true`,
                        onboarding_completed: `${profile.onboarding_completed} → true`,
                        estado_perfil: `${profile.estado_perfil} → activo`
                    }
                });
            } else {
                results.push({
                    profile_id: profile.id,
                    business_name: profile.business_name,
                    email: user.email,
                    status: 'ok',
                    message: 'Ya estaba correctamente configurado'
                });
            }
        }
        
        return Response.json({ 
            success: true,
            total_profiles: profiles.length,
            updated: results.filter(r => r.status === 'updated').length,
            already_ok: results.filter(r => r.status === 'ok').length,
            errors: results.filter(r => r.status === 'error').length,
            details: results
        });

    } catch (error) {
        console.error('Error fixing profiles:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});