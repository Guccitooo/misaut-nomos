import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get user data from request
        const body = await req.json();
        const { userId, selectedPlan, userData } = body;

        // Validation: userId is required
        if (!userId) {
            return Response.json({
                ok: false,
                step: "validation",
                message: 'El ID de usuario es obligatorio'
            }, { status: 400 });
        }

        // Check if user exists
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        const user = users[0];

        if (!user) {
            return Response.json({
                ok: false,
                step: "validation",
                message: 'Usuario no encontrado. Por favor, contacta con soporte.'
            }, { status: 404 });
        }

        // Validation: email is required
        if (!user.email) {
            return Response.json({
                ok: false,
                step: "validation",
                message: 'El email del usuario es obligatorio'
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
                ok: false,
                step: "plan",
                message: 'Plan de suscripción no encontrado'
            }, { status: 404 });
        }

        // Check if subscription already exists (idempotency)
        const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
            user_id: userId
        });

        let subscription;
        if (existingSubscriptions.length > 0) {
            // Subscription already exists, return existing one
            subscription = existingSubscriptions[0];
            console.log(`✅ Suscripción ya existía para usuario ${userId}`);
        } else {
            // Create new subscription
            const now = new Date();
            const expiration = new Date(now.getTime() + plan.duracion_dias * 24 * 60 * 60 * 1000);

            subscription = await base44.asServiceRole.entities.Subscription.create({
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
            console.log(`✅ Nueva suscripción creada para usuario ${userId}`);
        }

        // Check if professional profile already exists (idempotency)
        const existingProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: userId
        });

        let profile;
        if (existingProfiles.length > 0) {
            // Profile already exists, return existing one
            profile = existingProfiles[0];
            console.log(`✅ Perfil profesional ya existía para usuario ${userId}`);
        } else {
            // Create new professional profile with safe defaults
            const fullName = userData?.fullName || user.full_name || "Nuevo autónomo";
            const activity = userData?.activity || "Sin especificar";
            const city = userData?.city || user.city || "Por definir";

            profile = await base44.asServiceRole.entities.ProfessionalProfile.create({
                user_id: userId,
                business_name: fullName,
                description: `Profesional recién registrado en milautonomos. ${plan.descripcion}`,
                categories: activity !== "Sin especificar" ? [activity] : [],
                service_area: city,
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
            console.log(`✅ Nuevo perfil profesional creado para usuario ${userId}`);
        }

        // Send welcome email only if it's a new subscription
        if (existingSubscriptions.length === 0) {
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    subject: `✅ ${plan.mensaje_activacion}`,
                    body: `Hola ${user.full_name || user.email},

${plan.mensaje_activacion}

Detalles de tu plan:
- Plan: ${plan.nombre}
- Precio: ${plan.precio}€
- Duración: ${plan.duracion_dias} días
- Fecha de inicio: ${new Date().toLocaleDateString('es-ES')}
- Fecha de expiración: ${new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}

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
                console.log(`✅ Email de bienvenida enviado a ${user.email}`);
            } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
                // Don't fail the whole operation if email fails
            }
        }

        // Return success with profile data
        return Response.json({
            ok: true,
            message: 'Suscripción y perfil creados correctamente',
            data: {
                subscription: {
                    id: subscription.id,
                    plan_id: subscription.plan_id,
                    estado: subscription.estado,
                    fecha_expiracion: subscription.fecha_expiracion
                },
                profile: {
                    id: profile.id,
                    business_name: profile.business_name,
                    user_id: profile.user_id
                }
            }
        });

    } catch (error) {
        console.error('Error in onUserCreated:', error);
        return Response.json({
            ok: false,
            step: "error",
            message: error.message || 'Error al crear la suscripción y perfil',
            details: error.toString()
        }, { status: 500 });
    }
});