import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get parameters
        const { user_id, subscription_status } = await req.json();

        // Validate
        if (!user_id || !subscription_status) {
            return Response.json({ 
                error: 'user_id and subscription_status are required' 
            }, { status: 400 });
        }

        // Update user with service role (admin privileges)
        const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
        
        if (users.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        await base44.asServiceRole.entities.User.update(user_id, {
            subscription_status: subscription_status,
            user_type: "professionnel"
        });

        return Response.json({ 
            success: true,
            message: 'User subscription updated successfully'
        });

    } catch (error) {
        console.error('Error updating user subscription:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});