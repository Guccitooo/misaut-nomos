import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get request body
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
            planPrice
        } = body;

        // Get plan details
        let plan;
        let amount;
        let interval;
        let intervalCount = 1;
        
        if (planId) {
            // Using new plan system
            const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
                plan_id: planId
            });
            plan = plans[0];
            
            if (!plan) {
                return Response.json({
                    error: 'Plan not found'
                }, { status: 404 });
            }
            
            amount = plan.precio * 100; // Convert to cents
            
            // Determine interval based on duration
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
            // Default to monthly plan (backward compatibility)
            amount = 4900; // 49€
            interval = 'month';
            intervalCount = 1;
        }

        // Validate required fields
        if (!email || !fullName) {
            return Response.json({
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Prepare activity text
        const activityText = activity === "Otro tipo de servicio profesional" 
            ? `${activity}: ${activityOther}` 
            : (activity || "Sin especificar");

        // Create Stripe checkout session
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
            success_url: `${req.headers.get('origin')}/onboarding?success=true`,
            cancel_url: `${req.headers.get('origin')}/pricing-plans?canceled=true`,
        });

        return Response.json({
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return Response.json({
            error: 'Failed to create checkout session',
            details: error.message
        }, { status: 500 });
    }
});