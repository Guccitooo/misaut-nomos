import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    console.log('🔔 ========== WEBHOOK STRIPE ==========');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');
        
        if (!signature) {
            console.error('❌ Sin firma de Stripe');
            return Response.json({ error: 'Missing signature' }, { status: 400 });
        }

        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
            console.log(`✅ Evento verificado: ${event.type}`);
        } catch (err) {
            console.error('❌ Error verificando firma:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const subscription = event.data.object;
        const metadata = subscription.metadata || {};

        switch (event.type) {
            case 'checkout.session.completed': {
                console.log('🎉 CHECKOUT COMPLETADO');
                const session = event.data.object;
                const email = session.customer_details?.email || session.metadata?.email;
                
                if (!email) {
                    console.error('❌ Sin email');
                    return Response.json({ error: 'Missing email' }, { status: 400 });
                }

                const users = await base44.asServiceRole.entities.User.filter({ email });
                
                if (users.length > 0) {
                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        user_type: 'professional_pending',
                        professional_onboarding_completed: false,
                    });
                    console.log('✅ Usuario marcado como professional_pending');
                }
                
                console.log('✅ Checkout procesado');
                break;
            }
            
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                console.log(`🔄 ${event.type === 'customer.subscription.created' ? 'CREANDO' : 'ACTUALIZANDO'} SUSCRIPCIÓN`);
                
                const email = metadata.email || subscription.customer_email;
                if (!email) {
                    console.error('❌ Sin email');
                    return Response.json({ error: 'Missing email' }, { status: 400 });
                }

                // Get or create user
                let users = await base44.asServiceRole.entities.User.filter({ email });
                let userId;

                if (users.length === 0) {
                    const newUser = await base44.asServiceRole.entities.User.create({
                        email,
                        full_name: metadata.fullName || email.split('@')[0],
                        user_type: 'professional_pending',
                        professional_onboarding_completed: false,
                    });
                    userId = newUser.id;
                    console.log('✅ Usuario creado:', userId);
                } else {
                    userId = users[0].id;
                    await base44.asServiceRole.entities.User.update(userId, {
                        user_type: 'professional_pending',
                        professional_onboarding_completed: false,
                    });
                    console.log('✅ Usuario actualizado:', userId);
                }

                // Get plan
                const planId = metadata.planId || 'plan_monthly_trial';
                const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ plan_id: planId });
                const plan = plans[0];

                if (!plan) {
                    console.error('❌ Plan no encontrado:', planId);
                    return Response.json({ error: 'Plan not found' }, { status: 404 });
                }

                // Map Stripe status to our status
                let estado;
                if (subscription.status === 'trialing') {
                    estado = 'en_prueba';
                } else if (subscription.status === 'active') {
                    estado = 'activo';
                } else if (subscription.status === 'canceled') {
                    estado = 'cancelado';
                } else {
                    estado = 'finalizada';
                }

                console.log('💳 Estado de Stripe:', subscription.status, '→ Estado BD:', estado);

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
                    cancel_at_period_end: subscription.cancel_at_period_end || false,
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

                // Create empty professional profile if doesn't exist
                const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: userId });

                if (profiles.length === 0) {
                    await base44.asServiceRole.entities.ProfessionalProfile.create({
                        user_id: userId,
                        business_name: "",
                        email_contacto: email,
                        telefono_contacto: "",
                        metodos_contacto: ['chat_interno'],
                        categories: [],
                        photos: [],
                        formas_pago: [],
                        estado_perfil: 'pendiente',
                        visible_en_busqueda: false,
                        onboarding_completed: false,
                        acepta_terminos: false,
                        acepta_politica_privacidad: false,
                        consiente_contacto_clientes: false
                    });
                    console.log('✅ Perfil profesional vacío creado');
                }

                console.log('✅ PROCESO COMPLETADO - Usuario listo para onboarding');
                break;
            }

            case 'customer.subscription.deleted': {
                console.log('🔴 SUSCRIPCIÓN ELIMINADA');
                
                const subs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length > 0) {
                    await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
                        estado: 'finalizada',
                        renovacion_automatica: false
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

                    console.log('✅ Suscripción finalizada y perfil oculto');
                }
                break;
            }

            default:
                console.log('ℹ️ Evento no manejado:', event.type);
        }

        console.log('✅ Webhook procesado');
        return Response.json({ received: true });

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});