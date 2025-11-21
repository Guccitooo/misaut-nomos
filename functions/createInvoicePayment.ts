import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { invoiceId, publicAccess } = await req.json();

    const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId });
    const invoice = invoices[0];

    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!publicAccess) {
      const user = await base44.auth.me();
      if (!user || (invoice.professional_id !== user.id && user.role !== 'admin')) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Factura ${invoice.invoice_number}`,
              description: invoice.client_name,
            },
            unit_amount: Math.round(invoice.total * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/PayInvoice?invoice=${invoiceId}&success=true`,
      cancel_url: `${req.headers.get('origin')}/PayInvoice?invoice=${invoiceId}&canceled=true`,
      metadata: {
        invoiceId: invoiceId,
        type: 'invoice_payment'
      }
    });

    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
      payment_link: session.url,
      stripe_session_id: session.id
    });

    return Response.json({ 
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return Response.json({ 
      error: error.message || 'Error creating payment session' 
    }, { status: 500 });
  }
});