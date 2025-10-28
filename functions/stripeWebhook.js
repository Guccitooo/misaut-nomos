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
            
            // Extract metadata
            const metadata = session.metadata;
            const customerEmail = session.customer_email || metadata.email;

            // Get today's date for subscription
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
                    city: metadata.address.split(',').slice(-1)[0].trim(),
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
Stripe Subscription ID: ${session.subscription}

IMPORTANTE: Debes crear la cuenta manualmente:
1. Ir a Dashboard → Users → Invite User
2. Email: ${customerEmail}
3. Configurar como "professionnel" con estado "actif"
4. Fecha inicio: ${today.toISOString().split('T')[0]}
5. Fecha fin: ${nextMonth.toISOString().split('T')[0]}

Una vez creada la cuenta, el perfil profesional se creará automáticamente.

Gracias,
Sistema milautonomos`,
                    from_name: "milautonomos"
                });
            }

            // Create or update professional profile (in PENDING state)
            if (userId) {
                const existingProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: userId
                });

                if (existingProfiles.length === 0) {
                    // Create new professional profile in PENDING state
                    await base44.asServiceRole.entities.ProfessionalProfile.create({
                        user_id: userId,
                        business_name: metadata.fullName,
                        description: `Profesional de ${activityCategory}. Completa tu perfil para aparecer en búsquedas.`,
                        categories: [activityCategory],
                        service_area: metadata.address.split(',').slice(-1)[0].trim(),
                        opening_hours: "A convenir",
                        cif_nif: metadata.cifNif,
                        telefono_contacto: metadata.phone,
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

Tu suscripción ha sido activada correctamente. ${isNewUser ? 'Recibirás otro correo en las próximas horas con tus credenciales de acceso.' : ''}

Detalles de tu suscripción:
- Plan: Profesional mensual
- Precio: 29€/mes
- Fecha de inicio: ${today.toLocaleDateString('es-ES')}
- Próxima renovación: ${nextMonth.toLocaleDateString('es-ES')}

⚠️ IMPORTANTE: Tu perfil aún no está visible en las búsquedas.

Para que los clientes puedan encontrarte, debes completar tu perfil profesional con:
- Descripción de tus servicios
- Zona de trabajo
- Fotos de tus trabajos realizados
- Tarifas y formas de pago

Próximos pasos:
1. ${isNewUser ? 'Espera el correo con tus credenciales e inicia sesión' : 'Inicia sesión en milautonomos.com'}
2. Completa el quiz de perfil profesional (5 minutos)
3. Sube fotos de tus trabajos
4. ¡Tu perfil se publicará automáticamente!

Una vez completado, aparecerás en "Buscar Autónomos" y empezarás a recibir contactos.

Gracias por unirte a milautonomos,
Equipo milautonomos`,
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