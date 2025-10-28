import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get user email from request
        const { email } = await req.json();

        if (!email) {
            return Response.json({ 
                error: 'Email is required' 
            }, { status: 400 });
        }

        // Find user by email using service role
        const users = await base44.asServiceRole.entities.User.filter({ email });
        
        if (users.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];

        // Update user with active subscription
        const today = new Date();
        const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: "actif",
            user_type: "professionnel",
            subscription_start_date: today.toISOString().split('T')[0],
            subscription_end_date: in30Days.toISOString().split('T')[0],
            last_payment_date: today.toISOString().split('T')[0]
        });

        // Also ensure professional profile is active
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
            user_id: user.id
        });

        if (profiles.length > 0) {
            await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
                estado_perfil: "activo",
                visible_en_busqueda: true,
                onboarding_completed: true
            });
        }

        return Response.json({ 
            success: true,
            message: 'Usuario activado correctamente',
            user: {
                id: user.id,
                email: user.email,
                subscription_status: "actif",
                user_type: "professionnel"
            }
        });

    } catch (error) {
        console.error('Error fixing user subscription:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});