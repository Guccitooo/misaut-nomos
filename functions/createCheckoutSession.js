import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
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
            isTrial // ✅ Nuevo parámetro para indicar si es trial
        } = body;

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

        // ✅ CAMBIO CRÍTICO: Si es trial, usar mode: 'setup' para capturar tarjeta sin cobrar
        // Después crear suscripción con trial_period_days
        
        if (isTrial && planId === "plan_monthly_trial") {
            // ✅ Modo SETUP para prueba gratuita (captura tarjeta sin cobrar)
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'setup', // ✅ Modo setup en lugar de subscription
                customer_email: email,
                metadata: {
                    email,
                    fullName,
                    userType: userType || "autonomo",
                    cifNif: cifNif || "",
                    phone: phone || "",
                    activity: activityText,
                    address: address || "",
                    paymentMethod: paymentMethod || "stripe",
                    planId: planId,
                    isTrial: "true"
                },
                success_url: `${req.headers.get('origin')}/profile-onboarding?trial_setup=success`,
                cancel_url: `${req.headers.get('origin')}/pricing-plans?canceled=true`,
            });

            return Response.json({
                sessionId: session.id,
                url: session.url
            });
        } else {
            // ✅ Modo normal para planes de pago
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'subscription',
                line_items: [
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: plan ? `Plan ${plan.nombre} - milautonomos` : 'Suscripción Profesional milautonomos',
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
                metadata: {
                    email,
                    fullName,
                    userType: userType || "autonomo",
                    cifNif: cifNif || "",
                    phone: phone || "",
                    activity: activityText,
                    address: address || "",
                    paymentMethod: paymentMethod || "stripe",
                    planId: planId || "plan_monthly_trial",
                },
                success_url: `${req.headers.get('origin')}/profile-onboarding?success=true`,
                cancel_url: `${req.headers.get('origin')}/pricing-plans?canceled=true`,
            });

            return Response.json({
                sessionId: session.id,
                url: session.url
            });
        }
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return Response.json({
            error: 'Failed to create checkout session',
            details: error.message
        }, { status: 500 });
    }
});