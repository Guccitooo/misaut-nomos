import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        console.log('🔍 Verificando suscripciones expiradas...');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get all cancelled subscriptions
        const cancelledSubs = await base44.asServiceRole.entities.Subscription.filter({
            estado: "cancelado"
        });
        
        console.log(`📦 Suscripciones canceladas encontradas: ${cancelledSubs.length}`);
        
        const results = {
            checked: 0,
            expired: 0,
            stillActive: 0,
            errors: []
        };
        
        for (const sub of cancelledSubs) {
            results.checked++;
            
            try {
                const expirationDate = new Date(sub.fecha_expiracion);
                expirationDate.setHours(0, 0, 0, 0);
                
                // Check if subscription has expired
                if (expirationDate < today) {
                    console.log(`⏰ Suscripción expirada detectada: ${sub.user_id}`);
                    
                    // Update subscription to "finalizada"
                    await base44.asServiceRole.entities.Subscription.update(sub.id, {
                        estado: "finalizada"
                    });
                    
                    // Update user status
                    await base44.asServiceRole.entities.User.update(sub.user_id, {
                        subscription_status: "annule"
                    });
                    
                    // Deactivate profile
                    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                        user_id: sub.user_id
                    });
                    
                    if (profiles.length > 0) {
                        await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                            visible_en_busqueda: false,
                            estado_perfil: "inactivo"
                        });
                        console.log(`✅ Perfil desactivado: ${profiles[0].business_name}`);
                    }
                    
                    // Send expiration notification email
                    const users = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
                    if (users.length > 0) {
                        try {
                            await base44.asServiceRole.integrations.Core.SendEmail({
                                to: users[0].email,
                                subject: "Tu suscripción ha finalizado - milautonomos",
                                body: `Hola ${users[0].full_name || users[0].email},

Tu periodo de suscripción a milautonomos ha finalizado.

Tu perfil ya no es visible en las búsquedas públicas y no recibirás nuevos contactos de clientes.

¿Quieres volver a aparecer en las búsquedas?
👉 Reactiva tu plan desde tu panel de usuario: milautonomos.com/subscription

Beneficios de reactivar tu suscripción:
✓ Aparece en las búsquedas
✓ Recibe contactos de clientes potenciales
✓ Gestiona tu perfil profesional
✓ Galería de fotos de trabajos
✓ Chat directo con clientes

Si tienes alguna pregunta, no dudes en contactarnos.

Gracias,
Equipo milautonomos`,
                                from_name: "milautonomos"
                            });
                        } catch (emailError) {
                            console.error('Error enviando email:', emailError);
                        }
                    }
                    
                    results.expired++;
                } else {
                    const daysLeft = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
                    console.log(`⏳ Suscripción cancelada pero aún válida (${daysLeft} días restantes): ${sub.user_id}`);
                    results.stillActive++;
                }
            } catch (error) {
                console.error(`Error procesando suscripción ${sub.id}:`, error);
                results.errors.push({
                    subscription_id: sub.id,
                    error: error.message
                });
            }
        }
        
        console.log('✅ Verificación completada:', results);
        
        return Response.json({
            success: true,
            message: 'Verificación de suscripciones completada',
            results: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error verificando suscripciones:', error);
        return Response.json({
            error: 'Error al verificar suscripciones',
            details: error.message
        }, { status: 500 });
    }
});