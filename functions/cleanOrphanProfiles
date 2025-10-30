import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ✅ Limpia perfiles profesionales "huérfanos" (sin usuario asociado)
 * 
 * Esto ocurre cuando:
 * - Un usuario fue eliminado del sistema de autenticación
 * - Pero su perfil profesional sigue en la BD
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

        console.log('🧹 Iniciando limpieza de perfiles huérfanos...');

        // 1. Obtener TODOS los perfiles
        const allProfiles = await base44.asServiceRole.entities.ProfessionalProfile.list();
        console.log(`📊 Total perfiles: ${allProfiles.length}`);

        // 2. Obtener TODOS los usuarios
        const allUsers = await base44.asServiceRole.entities.User.list();
        const userIds = new Set(allUsers.map(u => u.id));
        console.log(`📊 Total usuarios: ${allUsers.length}`);

        // 3. Encontrar perfiles huérfanos
        const orphanProfiles = allProfiles.filter(profile => 
            !userIds.has(profile.user_id)
        );

        console.log(`🗑️ Perfiles huérfanos encontrados: ${orphanProfiles.length}`);

        const cleanedProfiles = [];

        for (const profile of orphanProfiles) {
            try {
                console.log(`🗑️ Eliminando perfil: ${profile.business_name} (user_id: ${profile.user_id})`);
                
                // Eliminar el perfil
                await base44.asServiceRole.entities.ProfessionalProfile.delete(profile.id);
                
                cleanedProfiles.push({
                    business_name: profile.business_name,
                    user_id: profile.user_id,
                    email: profile.email_contacto
                });
                
                console.log(`✅ Perfil eliminado: ${profile.business_name}`);
            } catch (error) {
                console.error(`❌ Error eliminando perfil ${profile.business_name}:`, error.message);
            }
        }

        return Response.json({
            ok: true,
            message: `Limpieza completada: ${cleanedProfiles.length} perfiles huérfanos eliminados`,
            cleaned_profiles: cleanedProfiles,
            details: {
                total_profiles: allProfiles.length,
                total_users: allUsers.length,
                orphan_profiles: orphanProfiles.length,
                cleaned: cleanedProfiles.length
            }
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