import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { ticketId, recipientId, type, message } = await req.json();

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ id: ticketId });
    const ticket = tickets[0];

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    let recipientEmail;
    let subject;
    let body;

    if (recipientId === 'admin') {
      recipientEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@misautonomos.com';
      subject = `Nuevo ticket: ${ticket.ticket_number}`;
      body = `
        Nuevo ticket creado en MisAutónomos:

        Número: ${ticket.ticket_number}
        Título: ${ticket.title}
        Tipo: ${ticket.type}
        Creado por: ${ticket.creator_name}
        
        Descripción:
        ${ticket.description}

        Ver ticket: ${req.headers.get('origin')}/TicketDetail?id=${ticket.id}
      `;
    } else {
      const users = await base44.asServiceRole.entities.User.filter({ id: recipientId });
      const recipient = users[0];
      
      if (!recipient?.email) {
        return Response.json({ error: 'Recipient not found' }, { status: 404 });
      }

      recipientEmail = recipient.email;

      if (type === 'new_message') {
        subject = `Nuevo mensaje en ticket ${ticket.ticket_number}`;
        body = `
          Has recibido un nuevo mensaje en tu ticket:

          Número: ${ticket.ticket_number}
          Título: ${ticket.title}
          
          Mensaje:
          ${message}

          Ver ticket: ${req.headers.get('origin')}/TicketDetail?id=${ticket.id}
        `;
      } else {
        subject = `Actualización de ticket ${ticket.ticket_number}`;
        body = `
          Tu ticket ha sido actualizado:

          Número: ${ticket.ticket_number}
          Título: ${ticket.title}
          Estado: ${ticket.status}

          Ver ticket: ${req.headers.get('origin')}/TicketDetail?id=${ticket.id}
        `;
      }
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      subject,
      body
    });

    return Response.json({ 
      success: true,
      message: 'Notification sent'
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json({ 
      error: error.message || 'Error sending notification' 
    }, { status: 500 });
  }
});