import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) {
            return Response.json({ error: 'missing_api_key', invoices: [] });
        }
        
        const stripe = new Stripe(stripeKey);
        
        // Obtener customer ID de la suscripción del usuario
        const subscriptions = await base44.entities.Subscription.filter({
            user_id: user.id
        });
        
        if (!subscriptions || subscriptions.length === 0) {
            return Response.json({ invoices: [] });
        }
        
        const subscription = subscriptions[0];
        const customerId = subscription.stripe_customer_id;
        
        if (!customerId) {
            return Response.json({ invoices: [] });
        }
        
        // Obtener facturas de Stripe
        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit: 50,
        });
        
        const formattedInvoices = invoices.data.map(inv => ({
            id: inv.id,
            number: inv.number || inv.id,
            date: new Date(inv.created * 1000).toISOString(),
            amount: inv.amount_paid / 100,
            currency: inv.currency.toUpperCase(),
            status: inv.status,
            pdf_url: inv.invoice_pdf,
            hosted_invoice_url: inv.hosted_invoice_url,
            description: inv.description || `Factura ${inv.number || inv.id}`,
        }));
        
        return Response.json({ invoices: formattedInvoices });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return Response.json({ error: error.message, invoices: [] }, { status: 500 });
    }
});