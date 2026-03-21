import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        console.log('🚀 Activando todos los perfiles profesionales...');
        
        // Get all professional profiles
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.list();
        
        console.log(`📦 Total perfiles encontrados: ${profiles.length}`);
        
        const results = [];
        
        for (const profile of profiles) {
            try {
                // ✅ Activar TODOS los perfiles con datos mínimos
                if (profile.business_name) {
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                        visible_en_busqueda: true,
                        onboarding_completed: true,
                        estado_perfil: "activo"
                    });
                    
                    results.push({
                        id: profile.id,
                        business_name: profile.business_name,
                        status: 'activated',
                        message: 'Perfil activado correctamente'
                    });
                    
                    console.log(`✅ Activado: ${profile.business_name}`);
                } else {
                    results.push({
                        id: profile.id,
                        status: 'skipped',
                        message: 'Sin nombre de negocio'
                    });
                }
            } catch (error) {
                console.error(`❌ Error activando ${profile.id}:`, error);
                results.push({
                    id: profile.id,
                    status: 'error',
                    message: error.message
                });
            }
        }
        
        const summary = {
            total: profiles.length,
            activated: results.filter(r => r.status === 'activated').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            errors: results.filter(r => r.status === 'error').length
        };
        
        console.log('✅ Activación completada:', summary);
        
        return Response.json({ 
            success: true,
            message: 'Perfiles activados correctamente',
            summary: summary,
            details: results
        });

    } catch (error) {
        console.error('❌ Error en activateAllProfiles:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});