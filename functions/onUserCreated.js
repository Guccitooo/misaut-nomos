import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get user data from request
        const body = await req.json();
        const { userId, selectedPlan, userData } = body;

        if (!userId) {
            return Response.json({
                error: 'User ID is required'
            }, { status: 400 });
        }

        // Get plan details (default to trial)
        const planId = selectedPlan || "plan_trial";
        const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
            plan_id: planId
        });
        
        const plan = plans[0];
        if (!plan) {
            return Response.json({
                error: 'Plan not found'
            }, { status: 404 });
        }

        // Calculate expiration date
        const now = new Date();
        const expiration = new Date(now.getTime() + plan.duracion_dias * 24 * 60 * 60 * 1000);

        // Create subscription
        const subscription = await base44.asServiceRole.entities.Subscription.create({
            user_id: userId,
            plan_id: plan.plan_id,
            plan_nombre: plan.nombre,
            plan_precio: plan.precio,
            fecha_inicio: now.toISOString(),
            fecha_expiracion: expiration.toISOString(),
            estado: plan.plan_id === "plan_trial" ? "en_prueba" : "activo",
            renovacion_automatica: plan.renovacion_automatica,
            metodo_pago: "stripe",
            fecha_ultima_renovacion: now.toISOString()
        });

        // Get user info
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        const user = users[0];

        // Check if professional profile already exists
        const existingProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: userId
        });

        let profile;
        if (existingProfiles.length === 0) {
            // Create professional profile
            profile = await base44.asServiceRole.entities.ProfessionalProfile.create({
                user_id: userId,
                business_name: userData?.fullName || user?.full_name || "Nuevo autónomo",
                description: `Profesional recién registrado en milautonomos. ${plan.descripcion}`,
                categories: userData?.activity ? [userData.activity] : [],
                service_area: userData?.city || user?.city || "Por definir",
                opening_hours: "A convenir",
                cif_nif: userData?.cifNif || "",
                photos: [],
                price_range: "€€",
                average_rating: 0,
                total_reviews: 0,
                website: "",
                social_links: {
                    facebook: "",
                    instagram: "",
                    linkedin: ""
                }
            });
        } else {
            profile = existingProfiles[0];
        }

        // Send welcome email
        if (user) {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: user.email,
                subject: `✅ ${plan.mensaje_activacion}`,
                body: `Hola ${user.full_name || user.email},

${plan.mensaje_activacion}

Detalles de tu plan:
- Plan: ${plan.nombre}
- Precio: ${plan.precio}€
- Duración: ${plan.duracion_dias} días
- Fecha de inicio: ${now.toLocaleDateString('es-ES')}
- Fecha de expiración: ${expiration.toLocaleDateString('es-ES')}

${plan.plan_id === "plan_trial" ? 
`⚠️ IMPORTANTE: Al finalizar tu prueba gratuita, tu plan se convertirá automáticamente en ${plan.plan_siguiente} (49€/mes) si no lo cancelas antes.` : 
`Tu perfil profesional ya está visible en "Buscar Autónomos" y puedes empezar a recibir contactos de clientes.`}

Próximos pasos:
1. Completa tu perfil profesional
2. Añade fotos de tus trabajos
3. Describe tus servicios en detalle
4. ¡Empieza a recibir clientes!

Gracias por unirte a milautonomos,
Equipo milautonomos`,
                from_name: "milautonomos"
            });
        }

        console.log(`✅ Suscripción y perfil creados para usuario ${userId}`);

        return Response.json({
            success: true,
            message: `Suscripción y perfil creados correctamente`,
            subscription,
            profile
        });

    } catch (error) {
        console.error('Error in onUserCreated:', error);
        return Response.json({
            error: 'Failed to create subscription and profile',
            details: error.message
        }, { status: 500 });
    }
});