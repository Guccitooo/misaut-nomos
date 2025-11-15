import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const { 
            email, 
            fullName, 
            userType, 
            cifNif, 
            phone, 
            activity, 
            activityOther,
            address,
            paymentMethod,
            planId,
            planPrice,
            isTrial,
            isReactivation
        } = body;

        console.log('💳 ========== CREANDO CHECKOUT SESSION ==========');
        console.log('📧 Email:', email);
        console.log('💼 Plan:', planId);
        console.log('🎁 Trial:', isTrial);
        console.log('🔄 Reactivación:', isReactivation);

        if (isTrial && planId === "plan_monthly_trial") {
            const users = await base44.asServiceRole.entities.User.filter({ email });
            if (users.length > 0) {
                const userId = users[0].id;
                
                const previousSubs = await base44.asServiceRole.entities.Subscription.filter({
                    user_id: userId
                });
                
                const hasUsedTrial = previousSubs.some(sub => 
                    sub.plan_id === "plan_monthly_trial" || sub.estado === "en_prueba"
                );
                
                if (hasUsedTrial) {
                    console.log('❌ Usuario ya usó trial anteriormente');
                    return Response.json({
                        error: 'Ya has usado tu periodo gratuito anteriormente. Por favor, selecciona un plan de pago.',
                        code: 'TRIAL_ALREADY_USED'
                    }, { status: 400 });
                }
            }
        }

        let plan;
        let amount;
        let interval;
        let intervalCount = 1;
        
        if (planId) {
            const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
                plan_id: planId
            });
            plan = plans[0];
            
            if (!plan) {
                return Response.json({
                    error: 'Plan not found'
                }, { status: 404 });
            }
            
            amount = plan.precio * 100;
            
            if (plan.duracion_dias === 30) {
                interval = 'month';
                intervalCount = 1;
            } else if (plan.duracion_dias === 90) {
                interval = 'month';
                intervalCount = 3;
            } else if (plan.duracion_dias === 365) {
                interval = 'year';
                intervalCount = 1;
            } else {
                interval = 'month';
                intervalCount = 1;
            }
            
        } else {
            amount = 4900;
            interval = 'month';
            intervalCount = 1;
        }

        if (!email || !fullName) {
            return Response.json({
                error: 'Missing required fields'
            }, { status: 400 });
        }

        const activityText = activity === "Otro tipo de servicio profesional" 
            ? `${activity}: ${activityOther}` 
            : (activity || "Sin especificar");

        const origin = req.headers.get('origin');
        let successUrl, cancelUrl;

        if (isReactivation) {
            successUrl = `${origin}/MyProfile?reactivation=success`;
            cancelUrl = `${origin}/MyProfile?reactivation=canceled`;
        } else {
            successUrl = `${origin}/MyProfile?onboarding=pending`;
            cancelUrl = `${origin}/PricingPlans?canceled=true`;
        }

        console.log('🔗 Success URL:', successUrl);
        console.log('🔗 Cancel URL:', cancelUrl);

        const metadata = {
            email: email,
            fullName: fullName,
            userType: userType || "professionnel",
            cifNif: cifNif || "",
            phone: phone || "",
            activity: activityText,
            address: address || "",
            paymentMethod: paymentMethod || "stripe",
            planId: planId || "plan_monthly_trial",
            isTrial: isTrial ? "true" : "false",
            isReactivation: isReactivation ? "true" : "false",
            created_at: new Date().toISOString()
        };

        console.log('📋 Metadata completo:', metadata);

        if (isTrial && planId === "plan_monthly_trial") {
            console.log('🎁 Creando sesión de prueba gratuita');
            
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'subscription',
                line_items: [
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: 'Plan Mensual MisAutónomos',
                                description: '7 días gratis, luego 49€/mes',
                            },
                            recurring: {
                                interval: 'month',
                                interval_count: 1,
                            },
                            unit_amount: 4900,
                        },
                        quantity: 1,
                    },
                ],
                subscription_data: {
                    trial_period_days: 7,
                    metadata: {
                        ...metadata,
                        plan_id: planId
                    }
                },
                customer_email: email,
                metadata: metadata,
                success_url: successUrl,
                cancel_url: cancelUrl,
                allow_promotion_codes: true,
            });

            console.log('✅ Sesión de trial creada:', session.id);
            console.log('🔗 URL checkout:', session.url);
            
            return Response.json({
                sessionId: session.id,
                url: session.url
            });
        } else {
            console.log('💳 Creando sesión de pago normal');
            
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'subscription',
                line_items: [
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: plan ? `Plan ${plan.nombre} - MisAutónomos` : 'Suscripción Profesional MisAutónomos',
                                description: plan ? plan.descripcion : 'Acceso completo a la plataforma profesional',
                            },
                            recurring: {
                                interval: interval,
                                interval_count: intervalCount,
                            },
                            unit_amount: amount,
                        },
                        quantity: 1,
                    },
                ],
                customer_email: email,
                metadata: metadata,
                subscription_data: {
                    metadata: {
                        ...metadata,
                        plan_id: planId
                    }
                },
                success_url: successUrl,
                cancel_url: cancelUrl,
                allow_promotion_codes: true,
            });

            console.log('✅ Sesión creada:', session.id);
            console.log('🔗 URL checkout:', session.url);

            return Response.json({
                sessionId: session.id,
                url: session.url
            });
        }
    } catch (error) {
        console.error('❌ Error creating checkout session:', error);
        return Response.json({
            error: 'Failed to create checkout session',
            details: error.message
        }, { status: 500 });
    }
});