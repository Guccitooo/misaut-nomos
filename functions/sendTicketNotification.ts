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
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; }
              .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 40px 30px; text-align: center; }
              .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
              .content { padding: 40px 30px; }
              .ticket-badge { display: inline-block; background: #e0f2fe; color: #0c4a6e; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
              .message-box { background: #f0f9ff; border-left: 4px solid #06b6d4; padding: 20px; margin: 25px 0; border-radius: 8px; }
              .message-box h3 { margin: 0 0 12px; color: #0c4a6e; font-size: 16px; }
              .message-box p { margin: 0; color: #1f2937; line-height: 1.6; font-size: 15px; }
              .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 25px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3); }
              .footer { background: #f9fafb; padding: 25px 30px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💬 Nuevo Mensaje</h1>
              </div>
              <div class="content">
                <div style="text-align: center;">
                  <span class="ticket-badge">${ticket.ticket_number}</span>
                </div>
                <h2 style="color: #1f2937; margin: 0 0 10px;">${ticket.title}</h2>
                
                <div class="message-box">
                  <h3>Mensaje recibido:</h3>
                  <p>${message}</p>
                </div>

                <div style="text-align: center;">
                  <a href="${req.headers.get('origin')}/TicketDetail?id=${ticket.id}" class="btn">Ver y Responder →</a>
                </div>
              </div>
              <div class="footer">
                <p>MisAutónomos · Sistema de tickets de soporte</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else if (type === 'status_changed') {
        const { newStatus } = await req.json();
        const statusLabels = {
          abierto: 'Abierto',
          en_progreso: 'En progreso',
          resuelto: 'Resuelto',
          cerrado: 'Cerrado'
        };
        const statusColors = {
          abierto: '#3b82f6',
          en_progreso: '#f59e0b',
          resuelto: '#10b981',
          cerrado: '#6b7280'
        };
        const statusIcons = {
          abierto: '🔵',
          en_progreso: '⚡',
          resuelto: '✅',
          cerrado: '🔒'
        };
        
        subject = `🔔 Ticket ${ticket.ticket_number} - ${statusLabels[newStatus] || newStatus}`;
        body = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; }
              .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, ${statusColors[newStatus]} 0%, ${statusColors[newStatus]}dd 100%); padding: 40px 30px; text-align: center; }
              .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
              .content { padding: 40px 30px; }
              .status-box { background: #f9fafb; border: 2px solid ${statusColors[newStatus]}; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; }
              .status-box .icon { font-size: 48px; margin-bottom: 10px; }
              .status-box h2 { margin: 0; color: #1f2937; font-size: 24px; font-weight: 700; }
              .info { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info p { margin: 8px 0; color: #1f2937; font-size: 14px; }
              .info strong { color: #0c4a6e; }
              .btn { display: inline-block; background: linear-gradient(135deg, ${statusColors[newStatus]} 0%, ${statusColors[newStatus]}dd 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 25px; }
              .footer { background: #f9fafb; padding: 25px 30px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 Estado Actualizado</h1>
              </div>
              <div class="content">
                <div class="status-box">
                  <div class="icon">${statusIcons[newStatus]}</div>
                  <h2>${statusLabels[newStatus]}</h2>
                </div>
                
                <div class="info">
                  <p><strong>Ticket:</strong> ${ticket.ticket_number}</p>
                  <p><strong>Título:</strong> ${ticket.title}</p>
                  <p><strong>Nuevo estado:</strong> ${statusLabels[newStatus]}</p>
                </div>

                <div style="text-align: center;">
                  <a href="${req.headers.get('origin')}/TicketDetail?id=${ticket.id}" class="btn">Ver Detalles →</a>
                </div>
              </div>
              <div class="footer">
                <p>MisAutónomos · Sistema de tickets de soporte</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else {
        subject = `🎫 Ticket asignado: ${ticket.ticket_number}`;
        body = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; }
              .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; }
              .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; }
              .content { padding: 40px 30px; }
              .info-box { background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .btn { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 25px; }
              .footer { background: #f9fafb; padding: 25px 30px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎫 Nuevo Ticket Asignado</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">Se te ha asignado un nuevo ticket que requiere tu atención.</p>
                
                <div class="info-box">
                  <p style="margin: 8px 0;"><strong style="color: #6b21a8;">Ticket:</strong> ${ticket.ticket_number}</p>
                  <p style="margin: 8px 0;"><strong style="color: #6b21a8;">Título:</strong> ${ticket.title}</p>
                  <p style="margin: 8px 0;"><strong style="color: #6b21a8;">Tipo:</strong> ${ticket.type}</p>
                  <p style="margin: 8px 0;"><strong style="color: #6b21a8;">Creado por:</strong> ${ticket.creator_name}</p>
                </div>

                <h3 style="color: #1f2937; margin: 25px 0 15px;">Descripción:</h3>
                <p style="background: #f9fafb; padding: 15px; border-radius: 8px; color: #374151; line-height: 1.6;">${ticket.description}</p>

                <div style="text-align: center;">
                  <a href="${req.headers.get('origin')}/TicketDetail?id=${ticket.id}" class="btn">Ver Ticket →</a>
                </div>
              </div>
              <div class="footer">
                <p>MisAutónomos · Sistema de tickets de soporte</p>
              </div>
            </div>
          </body>
          </html>
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