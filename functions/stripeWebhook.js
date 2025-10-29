
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get the signature from headers
        const signature = req.headers.get('stripe-signature');
        
        if (!signature) {
            return Response.json({ error: 'No signature provided' }, { status: 400 });
        }

        // Get raw body
        const body = await req.text();

        // Verify webhook signature
        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Handle checkout.session.completed
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
            // ✅ Si es un setup (trial), crear suscripción con trial
            if (session.mode === 'setup') {
                const metadata = session.metadata;
                const customerEmail = session.customer_email || metadata.email;

                // Crear o actualizar usuario
                const existingUsers = await base44.asServiceRole.entities.User.filter({ 
                    email: customerEmail 
                });

                let userId;
                if (existingUsers.length > 0) {
                    userId = existingUsers[0].id;
                    
                    // Define today and trialEndDate within this scope
                    const today = new Date();
                    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

                    // ✅ Activar suscripción trial
                    await base44.asServiceRole.entities.User.update(existingUsers[0].id, {
                        full_name: metadata.fullName,
                        user_type: "professionnel",
                        phone: metadata.phone,
                        city: metadata.address?.split(',').slice(-1)[0].trim() || "",
                        subscription_status: "actif",
                        subscription_start_date: today.toISOString().split('T')[0],
                        subscription_end_date: trialEndDate.toISOString().split('T')[0],
                        last_payment_date: today.toISOString().split('T')[0],
                    });
                    
                    console.log(`✅ Trial activado para usuario existente: ${customerEmail}`);
                } else {
                    console.log(`⚠️ Usuario no existe aún para trial: ${customerEmail}`);
                    // If user doesn't exist, we can't create a profile for them or update their subscription status in Base44.
                    // This implies trials are for existing users, or the initial user creation happens elsewhere.
                    // Following the outline, no user creation is performed here if user doesn't exist.
                }

                // Crear perfil profesional si no existe (only if userId was found/updated)
                if (userId) {
                    const existingProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                        user_id: userId
                    });

                    if (existingProfiles.length === 0) {
                        await base44.asServiceRole.entities.ProfessionalProfile.create({
                            user_id: userId,
                            business_name: metadata.fullName,
                            description: `Profesional recién registrado. Completa tu perfil.`,
                            categories: [metadata.activity?.split(':')[0] || "Sin especificar"],
                            service_area: metadata.address?.split(',').slice(-1)[0].trim() || "Por definir",
                            opening_hours: "A convenir",
                            cif_nif: metadata.cifNif || "",
                            telefono_contacto: metadata.phone || "",
                            email_contacto: customerEmail,
                            photos: [],
                            price_range: "€€",
                            average_rating: 0,
                            total_reviews: 0,
                            estado_perfil: "pendiente",
                            visible_en_busqueda: false,
                            onboarding_completed: false
                        });
                        console.log(`✅ Perfil profesional creado en estado PENDIENTE para ${metadata.fullName} (Trial)`);
                    }
                    // No explicit update logic for existing profiles during trial sign-up, as per outline.
                }

                // Email de confirmación
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: customerEmail,
                    subject: "✅ Tu prueba gratuita de 7 días está activa",
                    body: `Hola ${metadata.fullName},

¡Bienvenido a milautonomos!

Tu prueba gratuita de 7 días ha sido activada correctamente.

📋 Detalles:
- Duración: 7 días
- Inicio: ${new Date().toLocaleDateString('es-ES')}
- Fin: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}
- Precio después: 49€/mes

⚠️ IMPORTANTE: 
- Tu tarjeta ha sido registrada pero NO se realizará ningún cobro durante los 7 días
- Si no cancelas antes del final del periodo, tu plan se renovará automáticamente por 49€/mes
- Tu perfil AÚN NO está visible. Completa el quiz para activarlo.

🚀 PRÓXIMO PASO:
Completa tu perfil profesional ahora para aparecer en las búsquedas.

Gracias por unirte,
Equipo milautonomos`,
                    from_name: "milautonomos"
                });

                console.log(`✅ Prueba gratuita configurada para ${customerEmail}`);
                return Response.json({ received: true });
            }
            
            // ✅ Flujo normal de subscription (planes de pago)
            const metadata = session.metadata;
            const customerEmail = session.customer_email || metadata.email;

            const today = new Date();
            const nextMonth = new Date(today);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            // Prepare activity text
            const activityText = metadata.activity || "Sin especificar";
            const activityCategory = activityText.includes(":") 
                ? activityText.split(":")[0] 
                : activityText;

            // Check if user already exists
            const existingUsers = await base44.asServiceRole.entities.User.filter({ 
                email: customerEmail 
            });

            let userId;
            let isNewUser = false;

            if (existingUsers.length > 0) {
                // ✅ Update existing user with ACTIVE subscription
                userId = existingUsers[0].id;
                await base44.asServiceRole.entities.User.update(existingUsers[0].id, {
                    full_name: metadata.fullName,
                    user_type: "professionnel",
                    phone: metadata.phone,
                    city: metadata.address?.split(',').slice(-1)[0].trim() || "", // Updated
                    subscription_status: "actif",
                    subscription_start_date: today.toISOString().split('T')[0],
                    subscription_end_date: nextMonth.toISOString().split('T')[0],
                    last_payment_date: today.toISOString().split('T')[0],
                });
                console.log(`✅ Usuario existente actualizado con suscripción activa: ${customerEmail}`);
            } else {
                // New user - send email to admin to create account
                isNewUser = true;
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: "admin@milautonomos.com",
                    subject: "✅ Pago confirmado - Crear cuenta milautonomos",
                    body: `Pago confirmado para nueva suscripción:

Email: ${customerEmail}
Nombre: ${metadata.fullName}
NIF/CIF: ${metadata.cifNif}
Teléfono: ${metadata.phone}
Actividad: ${activityText}
Dirección: ${metadata.address}

Stripe Customer ID: ${session.customer}
Stripe Subscription ID: ${session.subscription}`, // Simplified body as per outline
                    from_name: "milautonomos"
                });
            }

            // Create or update professional profile (in PENDING state)
            if (userId) { // userId will be defined if existing user was found
                const existingProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: userId
                });

                if (existingProfiles.length === 0) {
                    // Create new professional profile in PENDING state
                    await base44.asServiceRole.entities.ProfessionalProfile.create({
                        user_id: userId,
                        business_name: metadata.fullName,
                        description: `Profesional de ${activityCategory}.`, // Simplified description
                        categories: [activityCategory],
                        service_area: metadata.address?.split(',').slice(-1)[0].trim() || "", // Updated
                        opening_hours: "A convenir",
                        cif_nif: metadata.cifNif || "", // Added default empty string
                        telefono_contacto: metadata.phone || "", // Added default empty string
                        email_contacto: customerEmail,
                        photos: [],
                        price_range: "€€",
                        average_rating: 0,
                        total_reviews: 0,
                        website: "",
                        social_links: {
                            facebook: "",
                            instagram: "",
                            linkedin: ""
                        },
                        estado_perfil: "pendiente",
                        visible_en_busqueda: false,
                        onboarding_completed: false
                    });

                    console.log(`✅ Perfil profesional creado en estado PENDIENTE para ${metadata.fullName}`);
                } else {
                    // Update existing profile to ensure it stays active if already completed
                    const profile = existingProfiles[0];
                    if (profile.onboarding_completed) {
                        await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
                            estado_perfil: "activo",
                            visible_en_busqueda: true
                        });
                        console.log(`✅ Perfil profesional actualizado a activo para ${metadata.fullName}`);
                    }
                }
            }

            // Send confirmation email with link to complete profile
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: customerEmail,
                subject: "✅ Bienvenido a milautonomos - Completa tu perfil",
                body: `Hola ${metadata.fullName},

¡Bienvenido a milautonomos!

Tu suscripción ha sido activada correctamente.

⚠️ IMPORTANTE: Tu perfil aún NO está visible.
Completa tu perfil profesional para aparecer en búsquedas.

Gracias,
Equipo milautonomos`, // Simplified body as per outline
                from_name: "milautonomos"
            });

            console.log(`✅ Flujo de alta completado para ${metadata.fullName} (${customerEmail})`);
        }

        // Handle invoice.payment_succeeded (monthly renewals)
        if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;
            const customerEmail = invoice.customer_email;

            if (customerEmail) {
                const users = await base44.asServiceRole.entities.User.filter({ 
                    email: customerEmail 
                });

                if (users.length > 0) {
                    const today = new Date();
                    const nextMonth = new Date(today);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);

                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        subscription_status: "actif",
                        subscription_end_date: nextMonth.toISOString().split('T')[0],
                        last_payment_date: today.toISOString().split('T')[0],
                    });

                    console.log(`✅ Suscripción renovada para ${customerEmail}`);
                }
            }
        }

        // Handle subscription.deleted (cancellations)
        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const customer = await stripe.customers.retrieve(subscription.customer);
            const customerEmail = customer.email;

            if (customerEmail) {
                const users = await base44.asServiceRole.entities.User.filter({ 
                    email: customerEmail 
                });

                if (users.length > 0) {
                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        subscription_status: "annule",
                    });

                    // Send cancellation email
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: customerEmail,
                        subject: "Tu suscripción ha sido cancelada - milautonomos",
                        body: `Hola,

Tu suscripción a milautonomos ha sido cancelada.

Tu perfil ya no será visible en el listado de "Buscar Autónomos".

Si deseas reactivar tu suscripción, puedes hacerlo en cualquier momento desde tu panel de usuario.

Si tienes alguna pregunta, no dudes en contactarnos.

Gracias,
Equipo milautonomos`,
                        from_name: "milautonomos"
                    });

                    console.log(`❌ Suscripción cancelada para ${customerEmail}`);
                }
            }
        }

        // Handle payment_failed
        if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object;
            const customerEmail = invoice.customer_email;

            if (customerEmail) {
                const users = await base44.asServiceRole.entities.User.filter({ 
                    email: customerEmail 
                });

                if (users.length > 0) {
                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        subscription_status: "suspendu",
                    });

                    // Send payment failed email
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: customerEmail,
                        subject: "⚠️ Problema con tu pago - milautonomos",
                        body: `Hola,

Hemos tenido un problema al procesar tu pago mensual de milautonomos.

Tu suscripción ha sido suspendida temporalmente. Por favor, actualiza tu método de pago para reactivarla.

Si no actualizas tu método de pago en los próximos 7 días, tu perfil dejará de ser visible en las búsquedas.

Puedes actualizar tu método de pago desde tu panel de Stripe.

Si tienes alguna pregunta, no dudes en contactarnos.

Gracias,
Equipo milautonomos`,
                        from_name: "milautonomos"
                    });

                    console.log(`⚠️ Pago fallido para ${customerEmail}`);
                }
            }
        }

        return Response.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({
            error: 'Webhook processing failed',
            details: error.message
        }, { status: 500 });
    }
});
