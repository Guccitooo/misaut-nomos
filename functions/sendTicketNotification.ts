import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { ticketId, recipientId, type, message } = await req.json();

    console.log('📧 Intentando enviar notificación:', { ticketId, recipientId, type });

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ id: ticketId });
    const ticket = tickets[0];

    if (!ticket) {
      console.error('❌ Ticket no encontrado:', ticketId);
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    console.log('✅ Ticket encontrado:', ticket.ticket_number);

    let recipientEmail;
    let subject;
    let body;

    if (recipientId === 'admin') {
      const adminEmail = Deno.env.get('ADMIN_EMAIL');
      console.log('📧 Email admin configurado:', adminEmail);
      
      recipientEmail = adminEmail;
      subject = `🎫 Nuevo ticket: ${ticket.ticket_number}`;
      body = `
        <h2>Nuevo ticket creado en MisAutónomos</h2>
        
        <p><strong>Número:</strong> ${ticket.ticket_number}</p>
        <p><strong>Título:</strong> ${ticket.title}</p>
        <p><strong>Tipo:</strong> ${ticket.type}</p>
        <p><strong>Prioridad:</strong> ${ticket.priority}</p>
        <p><strong>Creado por:</strong> ${ticket.creator_name}</p>
        
        <h3>Descripción:</h3>
        <p>${ticket.description}</p>

        <p><a href="${req.headers.get('origin')}/TicketDetail?id=${ticket.id}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Ver ticket</a></p>
      `;
    } else {
      const users = await base44.asServiceRole.entities.User.filter({ id: recipientId });
      const recipient = users[0];
      
      if (!recipient?.email) {
        console.error('❌ Destinatario no encontrado:', recipientId);
        return Response.json({ error: 'Recipient not found' }, { status: 404 });
      }

      recipientEmail = recipient.email;
      console.log('📧 Enviando a profesional:', recipientEmail);

      if (type === 'new_message') {
        subject = `💬 Nuevo mensaje en ticket ${ticket.ticket_number}`;
        body = `
          <h2>Nuevo mensaje en tu ticket</h2>

          <p><strong>Número:</strong> ${ticket.ticket_number}</p>
          <p><strong>Título:</strong> ${ticket.title}</p>
          
          <h3>Mensaje:</h3>
          <p>${message}</p>

          <p><a href="${req.headers.get('origin')}/TicketDetail?id=${ticket.id}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Ver ticket</a></p>
        `;
      } else {
        subject = `🎫 Tienes un nuevo ticket asignado: ${ticket.ticket_number}`;
        body = `
          <h2>Te han asignado un nuevo ticket</h2>

          <p><strong>Número:</strong> ${ticket.ticket_number}</p>
          <p><strong>Título:</strong> ${ticket.title}</p>
          <p><strong>Tipo:</strong> ${ticket.type}</p>
          <p><strong>Creado por:</strong> ${ticket.creator_name}</p>
          
          <h3>Descripción:</h3>
          <p>${ticket.description}</p>

          <p><a href="${req.headers.get('origin')}/TicketDetail?id=${ticket.id}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Ver ticket</a></p>
        `;
      }
    }

    console.log('📤 Enviando email a:', recipientEmail);
    
    const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      subject,
      body
    });

    console.log('✅ Email enviado exitosamente:', emailResult);

    return Response.json({ 
      success: true,
      message: 'Notification sent',
      recipient: recipientEmail
    });

  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    return Response.json({ 
      error: error.message || 'Error sending notification',
      details: error.toString()
    }, { status: 500 });
  }
});