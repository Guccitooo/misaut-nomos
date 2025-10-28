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
            paymentMethod 
        } = body;

        // Validate required fields
        if (!email || !fullName || !userType || !cifNif || !phone || !activity || !address || !paymentMethod) {
            return Response.json({
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Prepare activity text
        const activityText = activity === "Otro tipo de servicio profesional" 
            ? `${activity}: ${activityOther}` 
            : activity;

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Suscripción Profesional milautonomos',
                            description: 'Acceso completo a la plataforma profesional',
                        },
                        recurring: {
                            interval: 'month',
                        },
                        unit_amount: 2900, // 29€ per month in cents
                    },
                    quantity: 1,
                },
            ],
            customer_email: email,
            metadata: {
                email,
                fullName,
                userType,
                cifNif,
                phone,
                activity: activityText,
                address,
                paymentMethod,
            },
            success_url: `${req.headers.get('origin')}/onboarding?success=true`,
            cancel_url: `${req.headers.get('origin')}/onboarding?canceled=true`,
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