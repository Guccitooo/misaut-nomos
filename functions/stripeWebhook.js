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

        // Handle the event
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
                // Update existing user
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

            // Create or update professional profile
            if (userId) {
                const existingProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                    user_id: userId
                });

                if (existingProfiles.length === 0) {
                    // Create new professional profile
                    await base44.asServiceRole.entities.ProfessionalProfile.create({
                        user_id: userId,
                        business_name: metadata.fullName,
                        description: `Profesional de ${activityCategory}. Recién registrado en milautonomos.`,
                        categories: [activityCategory],
                        service_area: metadata.address.split(',').slice(-1)[0].trim(),
                        opening_hours: "A convenir",
                        cif_nif: metadata.cifNif,
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

                    console.log(`✅ Perfil profesional creado automáticamente para ${metadata.fullName}`);
                } else {
                    // Update existing profile
                    await base44.asServiceRole.entities.ProfessionalProfile.update(existingProfiles[0].id, {
                        business_name: metadata.fullName,
                        categories: [activityCategory],
                        service_area: metadata.address.split(',').slice(-1)[0].trim(),
                        cif_nif: metadata.cifNif,
                    });

                    console.log(`✅ Perfil profesional actualizado para ${metadata.fullName}`);
                }
            }

            // Send confirmation email to customer
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: customerEmail,
                subject: "✅ Bienvenido a milautonomos - Suscripción activada",
                body: `Hola ${metadata.fullName},

¡Bienvenido a milautonomos!

Tu suscripción ha sido activada correctamente. ${isNewUser ? 'Recibirás otro correo en las próximas horas con tus credenciales de acceso.' : 'Ya puedes acceder a tu cuenta profesional.'}

Detalles de tu suscripción:
- Plan: Profesional mensual
- Precio: 29€/mes
- Fecha de inicio: ${today.toLocaleDateString('es-ES')}
- Próxima renovación: ${nextMonth.toLocaleDateString('es-ES')}

Tu perfil profesional ha sido creado automáticamente y ya apareces en el listado de "Buscar Autónomos".

Próximos pasos para activar tu perfil al 100%:
1. ${isNewUser ? 'Espera el correo con tus credenciales e inicia sesión' : 'Inicia sesión en milautonomos.com'}
2. Ve a "Mi Perfil" y completa tu información
3. Añade fotos de tus trabajos realizados
4. Escribe una descripción detallada de tus servicios
5. ¡Comienza a recibir contactos de clientes!

Tu ficha profesional:
- Nombre: ${metadata.fullName}
- Actividad: ${activityCategory}
- Zona: ${metadata.address.split(',').slice(-1)[0].trim()}
- Estado: Activo y visible en búsquedas

Cuanto más completes tu perfil, más clientes te encontrarán.

Si tienes alguna pregunta, no dudes en contactarnos.

Gracias por unirte a milautonomos,
Equipo milautonomos`,
                from_name: "milautonomos"
            });

            console.log(`✅ Flujo de alta completado para ${metadata.fullName} (${customerEmail})`);
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