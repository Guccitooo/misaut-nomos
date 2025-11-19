import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    console.log('🔔 WEBHOOK STRIPE');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');
        
        if (!signature) {
            return Response.json({ error: 'Missing signature' }, { status: 400 });
        }

        const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        console.log(`✅ Evento: ${event.type}`);

        const subscription = event.data.object;
        const metadata = subscription.metadata || {};
        const email = metadata.email || subscription.customer_email;

        if (!email) {
            console.error('❌ Sin email');
            return Response.json({ error: 'Missing email' }, { status: 400 });
        }

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                console.log('💳 Procesando suscripción para:', email);
                
                const users = await base44.asServiceRole.entities.User.filter({ email });
                if (users.length === 0) {
                    console.error('❌ Usuario no encontrado');
                    return Response.json({ error: 'User not found' }, { status: 404 });
                }
                
                const userId = users[0].id;

                // Map status
                let estado = 'finalizada';
                if (subscription.status === 'trialing') estado = 'en_prueba';
                else if (subscription.status === 'active') estado = 'activo';
                else if (subscription.status === 'canceled') estado = 'cancelado';

                console.log(`📊 Stripe: ${subscription.status} → BD: ${estado}`);

                // Get plan
                const planId = metadata.planId || 'plan_monthly_trial';
                const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: planId });
                const plan = plans[0];

                if (!plan) {
                    console.error('❌ Plan no encontrado');
                    return Response.json({ error: 'Plan not found' }, { status: 404 });
                }

                // Create or update subscription
                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });

                const subscriptionData = {
                    user_id: userId,
                    plan_id: planId,
                    plan_nombre: plan.nombre,
                    plan_precio: plan.precio,
                    fecha_inicio: new Date(subscription.current_period_start * 1000).toISOString(),
                    fecha_expiracion: new Date(subscription.current_period_end * 1000).toISOString(),
                    estado: estado,
                    renovacion_automatica: !subscription.cancel_at_period_end,
                    metodo_pago: 'stripe',
                    stripe_subscription_id: subscription.id,
                    stripe_customer_id: subscription.customer,
                    trial_start: subscription.status === 'trialing' ? new Date(subscription.current_period_start * 1000).toISOString() : null,
                    trial_end: subscription.status === 'trialing' ? new Date(subscription.current_period_end * 1000).toISOString() : null
                };

                if (existingSubs.length > 0) {
                    await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subscriptionData);
                    console.log('✅ Suscripción actualizada');
                } else {
                    await base44.asServiceRole.entities.Subscription.create(subscriptionData);
                    console.log('✅ Suscripción creada');
                }

                // Update user
                await base44.asServiceRole.entities.User.update(userId, {
                    user_type: 'professional_pending'
                });
                console.log('✅ Usuario → professional_pending');

                // Ensure profile exists
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: userId });
                if (profiles.length === 0) {
                    await base44.asServiceRole.entities.ProfessionalProfile.create({
                        user_id: userId,
                        business_name: "",
                        email_contacto: email,
                        metodos_contacto: ['chat_interno'],
                        categories: [],
                        photos: [],
                        formas_pago: [],
                        estado_perfil: 'pendiente',
                        visible_en_busqueda: false,
                        onboarding_completed: false,
                    });
                    console.log('✅ Perfil vacío creado');
                }

                console.log('✅ WEBHOOK COMPLETADO');
                break;
            }

            case 'customer.subscription.deleted': {
                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length > 0) {
                    await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
                        estado: 'finalizada'
                    });

                    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                        user_id: subs[0].user_id
                    });

                    if (profiles.length > 0) {
                        await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                            visible_en_busqueda: false,
                            estado_perfil: 'inactivo'
                        });
                    }
                    console.log('✅ Suscripción finalizada');
                }
                break;
            }
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});