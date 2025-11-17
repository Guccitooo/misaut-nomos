import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ticketId, recipientId, type, message, newStatus } = await req.json();

        const recipient = await base44.asServiceRole.entities.User.filter({ id: recipientId });
        if (recipient.length === 0) {
            return Response.json({ error: 'Recipient not found' }, { status: 404 });
        }

        const tickets = await base44.asServiceRole.entities.Ticket.filter({ id: ticketId });
        if (tickets.length === 0) {
            return Response.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const ticket = tickets[0];
        const recipientUser = recipient[0];

        let emailSubject = '';
        let emailBody = '';

        if (type === 'new_ticket') {
            emailSubject = `Nuevo ticket de soporte: ${ticket.ticket_number}`;
            emailBody = `
Hola ${recipientUser.full_name || recipientUser.email},

Tienes un nuevo ticket de soporte asignado:

📋 Ticket: ${ticket.ticket_number}
📝 Título: ${ticket.title}
📄 Descripción: ${ticket.description}

Puedes responder directamente desde tu panel de tickets en MisAutónomos.

Accede aquí: https://misautonomos.es

Saludos,
Equipo MisAutónomos
            `;
        } else if (type === 'new_message') {
            emailSubject = `Nuevo mensaje en ticket ${ticket.ticket_number}`;
            emailBody = `
Hola ${recipientUser.full_name || recipientUser.email},

Has recibido un nuevo mensaje en tu ticket de soporte:

📋 Ticket: ${ticket.ticket_number}
📝 Asunto: ${ticket.title}
💬 Mensaje: ${message}

Responde desde tu panel de tickets en MisAutónomos.

Accede aquí: https://misautonomos.es

Saludos,
Equipo MisAutónomos
            `;
        } else if (type === 'status_changed') {
            const statusLabels = {
                abierto: 'Abierto',
                en_progreso: 'En progreso',
                resuelto: 'Resuelto',
                cerrado: 'Cerrado'
            };

            emailSubject = `Estado actualizado: Ticket ${ticket.ticket_number}`;
            emailBody = `
Hola ${recipientUser.full_name || recipientUser.email},

El estado de tu ticket ha sido actualizado:

📋 Ticket: ${ticket.ticket_number}
📝 Asunto: ${ticket.title}
✅ Nuevo estado: ${statusLabels[newStatus]}

Accede a tu ticket para más detalles: https://misautonomos.es

Saludos,
Equipo MisAutónomos
            `;
        }

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: recipientUser.email,
            subject: emailSubject,
            body: emailBody,
            from_name: 'MisAutónomos Soporte'
        });

        await base44.asServiceRole.entities.Notification.create({
            user_id: recipientId,
            type: 'ticket_update',
            title: emailSubject,
            message: type === 'new_message' ? message : `Ticket ${ticket.ticket_number} actualizado`,
            link: `/tickets?id=${ticketId}`,
            priority: ticket.priority === 'urgente' ? 'high' : 'medium'
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});