import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const { invoiceId, publicAccess } = await req.json();

    // Si es acceso público (cliente pagando), no requerir auth
    if (!publicAccess && !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId });
    const invoice = invoices[0];

    if (!invoice) {
      return Response.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Si no es acceso público, verificar que sea el propietario
    if (!publicAccess && user && invoice.professional_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Si ya tiene un link y no está pagada, reutilizarlo
    if (invoice.payment_link && invoice.status !== 'paid') {
      return Response.json({ 
        url: invoice.payment_link,
        sessionId: invoice.stripe_session_id,
        reused: true
      });
    }

    // Si ya está pagada, no crear nuevo link
    if (invoice.status === 'paid') {
      return Response.json({ 
        error: 'Esta factura ya está pagada',
        status: 'paid'
      }, { status: 400 });
    }

    // Obtener datos del profesional para la descripción
    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ 
      user_id: invoice.professional_id 
    });
    const professionalName = profiles[0]?.business_name || invoice.emisor_razon_social || 'Profesional';

    // Crear sesión de Stripe Checkout
    const baseUrl = req.headers.get('origin') || 'https://misautonomos.es';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Factura ${invoice.invoice_number}`,
              description: `${professionalName} - ${invoice.client_name}`,
            },
            unit_amount: Math.round(invoice.total * 100), // Stripe usa céntimos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/PayInvoice?invoice=${invoiceId}&success=true`,
      cancel_url: `${baseUrl}/PayInvoice?invoice=${invoiceId}&canceled=true`,
      customer_email: invoice.client_email,
      metadata: {
        type: 'invoice_payment',
        invoiceId: invoiceId,
        invoiceNumber: invoice.invoice_number,
        professionalId: invoice.professional_id,
        clientName: invoice.client_name,
        clientEmail: invoice.client_email
      }
    });

    // Guardar el link en la factura
    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
      payment_link: session.url,
      stripe_session_id: session.id
    });

    return Response.json({ 
      url: session.url,
      sessionId: session.id,
      reused: false
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return Response.json({ 
      error: error.message || 'Error creando el link de pago' 
    }, { status: 500 });
  }
});