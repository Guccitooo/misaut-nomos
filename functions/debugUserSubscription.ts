import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticación
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { email } = await req.json();
        const targetEmail = email || user.email;

        console.log('🔍 Diagnosticando suscripción para:', targetEmail);

        // 1. Verificar usuario en DB
        const users = await base44.asServiceRole.entities.User.filter({ 
            email: targetEmail 
        });

        if (users.length === 0) {
            return Response.json({
                ok: false,
                error: 'Usuario no encontrado en la base de datos',
                email: targetEmail
            }, { status: 404 });
        }

        const dbUser = users[0];
        console.log('👤 Usuario en DB:', {
            email: dbUser.email,
            user_type: dbUser.user_type,
            subscription_status: dbUser.subscription_status,
            subscription_start_date: dbUser.subscription_start_date,
            subscription_end_date: dbUser.subscription_end_date
        });

        // 2. Buscar suscripciones en Stripe
        const customers = await stripe.customers.list({
            email: targetEmail,
            limit: 1
        });

        let stripeCustomer = null;
        let stripeSubscription = null;

        if (customers.data.length > 0) {
            stripeCustomer = customers.data[0];
            console.log('💳 Cliente encontrado en Stripe:', stripeCustomer.id);

            // Obtener suscripciones
            const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomer.id,
                limit: 10
            });

            if (subscriptions.data.length > 0) {
                // Obtener la más reciente
                stripeSubscription = subscriptions.data[0];
                console.log('📋 Suscripción en Stripe:', {
                    id: stripeSubscription.id,
                    status: stripeSubscription.status,
                    trial_end: stripeSubscription.trial_end,
                    current_period_end: stripeSubscription.current_period_end
                });
            }
        }

        // 3. Verificar perfil profesional
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: dbUser.id
        });

        const profile = profiles[0];
        console.log('💼 Perfil profesional:', profile ? {
            business_name: profile.business_name,
            estado_perfil: profile.estado_perfil,
            visible_en_busqueda: profile.visible_en_busqueda,
            onboarding_completed: profile.onboarding_completed
        } : 'NO EXISTE');

        // 4. Diagnosticar problemas
        const issues = [];
        const fixes = [];

        if (!dbUser.subscription_status) {
            issues.push('❌ subscription_status es NULL en la base de datos');
            fixes.push('Asignar subscription_status basado en Stripe');
        }

        if (!['actif', 'activo', 'en_prueba', 'trialing'].includes(dbUser.subscription_status)) {
            issues.push(`❌ subscription_status tiene valor inválido: "${dbUser.subscription_status}"`);
            fixes.push('Actualizar a estado válido');
        }

        if (dbUser.user_type !== 'professionnel') {
            issues.push(`❌ user_type es "${dbUser.user_type}" en lugar de "professionnel"`);
            fixes.push('Actualizar user_type a "professionnel"');
        }

        if (stripeSubscription && stripeSubscription.status !== 'canceled') {
            if (!dbUser.subscription_status || 
                !['actif', 'activo', 'en_prueba', 'trialing'].includes(dbUser.subscription_status)) {
                issues.push('⚠️ Stripe tiene suscripción activa pero DB no la refleja');
                fixes.push('Sincronizar estado de Stripe a DB');
            }
        }

        if (!stripeCustomer) {
            issues.push('⚠️ No se encontró cliente en Stripe');
        }

        if (!stripeSubscription) {
            issues.push('⚠️ No se encontró suscripción en Stripe');
        }

        // 5. Preparar respuesta de diagnóstico
        const diagnosis = {
            ok: issues.length === 0,
            timestamp: new Date().toISOString(),
            user: {
                email: dbUser.email,
                id: dbUser.id,
                user_type: dbUser.user_type,
                subscription_status: dbUser.subscription_status,
                subscription_start_date: dbUser.subscription_start_date,
                subscription_end_date: dbUser.subscription_end_date
            },
            stripe: {
                has_customer: !!stripeCustomer,
                customer_id: stripeCustomer?.id,
                has_subscription: !!stripeSubscription,
                subscription_id: stripeSubscription?.id,
                subscription_status: stripeSubscription?.status,
                trial_end: stripeSubscription?.trial_end ? 
                    new Date(stripeSubscription.trial_end * 1000).toISOString() : null,
                current_period_end: stripeSubscription?.current_period_end ?
                    new Date(stripeSubscription.current_period_end * 1000).toISOString() : null
            },
            profile: profile ? {
                exists: true,
                business_name: profile.business_name,
                estado_perfil: profile.estado_perfil,
                visible_en_busqueda: profile.visible_en_busqueda,
                onboarding_completed: profile.onboarding_completed
            } : {
                exists: false
            },
            issues,
            fixes,
            can_fix: issues.length > 0 && stripeSubscription
        };

        return Response.json(diagnosis);

    } catch (error) {
        console.error('❌ Error en debug:', error);
        return Response.json({
            ok: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});