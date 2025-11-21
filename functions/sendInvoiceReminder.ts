import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    const invoices = await base44.entities.Invoice.filter({ id: invoiceId });
    const invoice = invoices[0];

    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.professional_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const daysOverdue = invoice.due_date 
      ? Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24))
      : 0;

    let subject, body;
    
    if (daysOverdue > 0) {
      subject = `Recordatorio: Factura ${invoice.invoice_number} vencida`;
      body = `
        Estimado/a ${invoice.client_name},

        Le recordamos que la factura ${invoice.invoice_number} se encuentra vencida desde hace ${daysOverdue} días.

        Detalles de la factura:
        - Número: ${invoice.invoice_number}
        - Fecha de emisión: ${new Date(invoice.issue_date).toLocaleDateString('es-ES')}
        - Fecha de vencimiento: ${new Date(invoice.due_date).toLocaleDateString('es-ES')}
        - Importe total: ${invoice.total}€

        Por favor, proceda con el pago a la mayor brevedad posible.

        ${invoice.payment_link ? `Puede pagar online aquí: ${invoice.payment_link}` : ''}

        Gracias por su atención.

        Saludos cordiales,
        ${user.full_name || 'El equipo'}
      `;
    } else {
      subject = `Recordatorio: Factura ${invoice.invoice_number} pendiente de pago`;
      body = `
        Estimado/a ${invoice.client_name},

        Le recordamos que tiene pendiente el pago de la siguiente factura:

        Detalles de la factura:
        - Número: ${invoice.invoice_number}
        - Fecha de emisión: ${new Date(invoice.issue_date).toLocaleDateString('es-ES')}
        - Fecha de vencimiento: ${new Date(invoice.due_date).toLocaleDateString('es-ES')}
        - Importe total: ${invoice.total}€

        ${invoice.payment_link ? `Puede pagar online aquí: ${invoice.payment_link}` : ''}

        Gracias por su atención.

        Saludos cordiales,
        ${user.full_name || 'El equipo'}
      `;
    }

    await base44.integrations.Core.SendEmail({
      to: invoice.client_email,
      subject,
      body
    });

    await base44.entities.Invoice.update(invoiceId, {
      last_reminder_date: new Date().toISOString()
    });

    return Response.json({ 
      success: true,
      message: 'Recordatorio enviado correctamente'
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return Response.json({ 
      error: error.message || 'Error sending reminder' 
    }, { status: 500 });
  }
});