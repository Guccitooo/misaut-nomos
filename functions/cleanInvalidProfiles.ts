import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Función para limpiar perfiles inválidos:
 * - Oculta perfiles sin suscripción activa
 * - Oculta perfiles sin datos completos
 * - Identifica y reporta casos como "Gucci Perez"
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticación de admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ 
                error: 'No autorizado. Solo administradores pueden ejecutar esta función.' 
            }, { status: 403 });
        }
        
        console.log('🧹 Iniciando limpieza de perfiles inválidos...');
        
        // 1. Obtener todos los perfiles profesionales
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.list();
        console.log(`📦 Total perfiles encontrados: ${profiles.length}`);
        
        const results = {
            total: profiles.length,
            hidden: [],
            valid: [],
            errors: []
        };
        
        for (const profile of profiles) {
            try {
                // 2. Verificar usuario asociado
                const users = await base44.asServiceRole.entities.User.filter({ 
                    id: profile.user_id 
                });
                
                if (users.length === 0) {
                    console.log(`⚠️ Perfil ${profile.id} sin usuario asociado`);
                    results.hidden.push({
                        id: profile.id,
                        business_name: profile.business_name,
                        reason: 'Usuario no existe'
                    });
                    
                    // Ocultar perfil
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                        visible_en_busqueda: false,
                        estado_perfil: "inactivo"
                    });
                    continue;
                }
                
                const user = users[0];
                
                // 3. Verificar suscripción activa
                if (!user.subscription_status || user.subscription_status !== "actif") {
                    console.log(`❌ Perfil ${profile.business_name} sin suscripción activa (${user.subscription_status || 'ninguna'})`);
                    results.hidden.push({
                        id: profile.id,
                        business_name: profile.business_name,
                        email: user.email,
                        reason: `Suscripción inválida: ${user.subscription_status || 'ninguna'}`
                    });
                    
                    // Ocultar perfil
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                        visible_en_busqueda: false,
                        estado_perfil: "pendiente"
                    });
                    continue;
                }
                
                // 4. Verificar datos completos
                const dataComplete = 
                    profile.business_name && 
                    profile.business_name.trim().length > 0 &&
                    profile.categories && 
                    profile.categories.length > 0 &&
                    profile.telefono_contacto &&
                    profile.service_area;
                
                if (!dataComplete) {
                    console.log(`⚠️ Perfil ${profile.business_name} con datos incompletos`);
                    results.hidden.push({
                        id: profile.id,
                        business_name: profile.business_name || 'Sin nombre',
                        email: user.email,
                        reason: 'Datos incompletos',
                        missing: {
                            business_name: !profile.business_name,
                            categories: !profile.categories || profile.categories.length === 0,
                            phone: !profile.telefono_contacto,
                            service_area: !profile.service_area
                        }
                    });
                    
                    // Ocultar perfil
                    await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                        visible_en_busqueda: false,
                        estado_perfil: "pendiente",
                        onboarding_completed: false
                    });
                    continue;
                }
                
                // 5. Perfil válido
                console.log(`✅ Perfil válido: ${profile.business_name}`);
                results.valid.push({
                    id: profile.id,
                    business_name: profile.business_name,
                    email: user.email,
                    subscription_status: user.subscription_status
                });
                
            } catch (error) {
                console.error(`❌ Error procesando perfil ${profile.id}:`, error);
                results.errors.push({
                    id: profile.id,
                    error: error.message
                });
            }
        }
        
        // 6. Generar reporte
        const summary = {
            total: results.total,
            valid: results.valid.length,
            hidden: results.hidden.length,
            errors: results.errors.length
        };
        
        console.log('📊 Resumen de limpieza:', summary);
        
        // 7. Enviar email de reporte a admin
        const adminEmail = Deno.env.get("ADMIN_EMAIL") || "soporte@misautonomos.es";
        
        if (results.hidden.length > 0 || results.errors.length > 0) {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: adminEmail,
                subject: `🧹 Reporte de limpieza de perfiles - ${summary.hidden} ocultados`,
                body: `Limpieza de perfiles completada

📊 RESUMEN:
- Total perfiles: ${summary.total}
- Perfiles válidos: ${summary.valid}
- Perfiles ocultados: ${summary.hidden}
- Errores: ${summary.errors}

❌ PERFILES OCULTADOS:
${results.hidden.map(p => `
- ${p.business_name} (${p.email})
  Razón: ${p.reason}
  ${p.missing ? `Falta: ${Object.keys(p.missing).filter(k => p.missing[k]).join(', ')}` : ''}
`).join('\n')}

${results.errors.length > 0 ? `
⚠️ ERRORES:
${results.errors.map(e => `- ID ${e.id}: ${e.error}`).join('\n')}
` : ''}

Los perfiles ocultados han sido marcados como "pendiente" o "inactivo" y ya no aparecen en las búsquedas.

---
Limpieza ejecutada: ${new Date().toLocaleString('es-ES')}`,
                from_name: 'milautonomos'
            });
        }
        
        return Response.json({
            success: true,
            summary: summary,
            details: {
                valid: results.valid,
                hidden: results.hidden,
                errors: results.errors
            }
        });
        
    } catch (error) {
        console.error('❌ Error en limpieza de perfiles:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});