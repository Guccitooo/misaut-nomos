import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('\n🔍 ========== DEBUG ESTADO USUARIO ==========');
        console.log('📧 Email:', user.email);
        console.log('👤 User Type:', user.user_type);
        console.log('✅ Onboarding Completed:', user.professional_onboarding_completed);
        
        // Get subscription
        const subs = await base44.asServiceRole.entities.Subscription.filter({
            user_id: user.id
        });
        
        console.log('\n💳 SUSCRIPCIONES ENCONTRADAS:', subs.length);
        if (subs.length > 0) {
            subs.forEach((sub, idx) => {
                console.log(`\nSuscripción ${idx + 1}:`, {
                    id: sub.id,
                    plan_id: sub.plan_id,
                    estado: sub.estado,
                    fecha_inicio: sub.fecha_inicio,
                    fecha_expiracion: sub.fecha_expiracion,
                    stripe_subscription_id: sub.stripe_subscription_id,
                    renovacion_automatica: sub.renovacion_automatica
                });
            });
        } else {
            console.log('❌ NO HAY SUSCRIPCIONES');
        }
        
        // Get profile
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: user.id
        });
        
        console.log('\n👔 PERFILES PROFESIONALES ENCONTRADOS:', profiles.length);
        if (profiles.length > 0) {
            const profile = profiles[0];
            console.log('Perfil:', {
                id: profile.id,
                business_name: profile.business_name,
                onboarding_completed: profile.onboarding_completed,
                visible_en_busqueda: profile.visible_en_busqueda,
                estado_perfil: profile.estado_perfil
            });
        } else {
            console.log('❌ NO HAY PERFIL PROFESIONAL');
        }
        
        // Get Stripe subscription
        if (subs.length > 0 && subs[0].stripe_subscription_id) {
            try {
                const Stripe = (await import('npm:stripe@14.10.0')).default;
                const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
                const stripeSub = await stripe.subscriptions.retrieve(subs[0].stripe_subscription_id);
                
                console.log('\n💳 STRIPE SUBSCRIPTION:', {
                    id: stripeSub.id,
                    status: stripeSub.status,
                    current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
                    cancel_at_period_end: stripeSub.cancel_at_period_end
                });
            } catch (stripeError) {
                console.log('⚠️ Error obteniendo suscripción de Stripe:', stripeError.message);
            }
        }
        
        console.log('\n========================================\n');
        
        return Response.json({
            user: {
                id: user.id,
                email: user.email,
                user_type: user.user_type,
                professional_onboarding_completed: user.professional_onboarding_completed
            },
            subscription: subs[0] || null,
            profile: profiles[0] || null,
            diagnosis: {
                has_subscription: subs.length > 0,
                subscription_active: subs.length > 0 && ['activo', 'active', 'en_prueba', 'trialing'].includes(subs[0].estado?.toLowerCase()),
                has_profile: profiles.length > 0,
                profile_visible: profiles.length > 0 && profiles[0].visible_en_busqueda,
                is_ready: user.user_type === 'professionnel' && profiles.length > 0 && profiles[0].visible_en_busqueda
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});