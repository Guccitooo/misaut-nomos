import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    );

    const base44 = createClientFromRequest(req);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      if (session.metadata?.type === 'invoice_payment') {
        const invoiceId = session.metadata.invoiceId;
        
        await base44.asServiceRole.entities.Invoice.update(invoiceId, {
          status: 'paid',
          payment_date: new Date().toISOString(),
          payment_method: 'stripe',
          stripe_payment_id: session.payment_intent
        });

        const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId });
        const invoice = invoices[0];

        if (invoice?.client_email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: invoice.client_email,
            subject: `Pago confirmado - Factura ${invoice.invoice_number}`,
            body: `
              Estimado/a ${invoice.client_name},

              Le confirmamos que hemos recibido el pago de la factura ${invoice.invoice_number}.

              Importe pagado: ${invoice.total}€
              Fecha de pago: ${new Date().toLocaleDateString('es-ES')}

              Gracias por su pago.

              Saludos cordiales
            `
          });
        }
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});