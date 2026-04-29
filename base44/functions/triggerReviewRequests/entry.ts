import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Scheduled daily function: comprueba conversaciones que cumplen los criterios
 * para enviar un review request al cliente.
 * 
 * Criterios:
 * - Al menos 3 mensajes (min 1 de cada lado)
 * - Han pasado ≥ 7 días desde el primer mensaje
 * - No existe Review para esa (client_id, professional_id)
 * - No se envió ya una request (campo review_request_sent en Message con type=review_request)
 * 
 * Envía:
 * - Message desde support_team al cliente
 * - Notification al cliente
 * 
 * Recordatorios: si no se responde, a los 5 días y a los 10 (máx 3 intentos).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Solo ejecución interna (cron) — verificar con token simple
    const authHeader = req.headers.get('authorization') || '';
    // Permitir ejecución de la automatización (sin auth token de usuario)

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Obtener todos los mensajes de hace más de 7 días
    const oldMessages = await base44.asServiceRole.entities.Message.filter({});
    
    // Agrupar por conversation_id
    const convMap = {};
    for (const msg of oldMessages) {
      if (!msg.conversation_id || msg.sender_id === 'support_team') continue;
      if (!convMap[msg.conversation_id]) {
        convMap[msg.conversation_id] = { messages: [], convId: msg.conversation_id };
      }
      convMap[msg.conversation_id].messages.push(msg);
    }

    let processed = 0;
    let sent = 0;

    for (const conv of Object.values(convMap)) {
      const msgs = conv.messages;
      if (msgs.length < 3) continue;

      // Ordenar por fecha
      msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const firstMsg = msgs[0];
      const firstDate = new Date(firstMsg.created_date);

      // Han pasado 7 días desde el primer mensaje?
      if (now - firstDate < 7 * 24 * 60 * 60 * 1000) continue;

      // Identificar client_id y professional_id
      // La conversación es entre dos users — uno de tipo client y uno de tipo professionnel
      const senderIds = [...new Set(msgs.map(m => m.sender_id))];
      if (senderIds.length < 2) continue;

      // Necesitamos saber quién es cliente y quién es pro
      let clientId = null;
      let professionalId = null;
      let businessName = null;

      // Usar professional_name y client_name de los mensajes para inferir
      const msgWithProfName = msgs.find(m => m.professional_name && m.professional_name.trim());
      const msgWithClientName = msgs.find(m => m.client_name && m.client_name.trim());

      // Buscar perfil profesional entre los senders
      for (const uid of senderIds) {
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: uid });
        if (profiles[0]) {
          professionalId = uid;
          businessName = profiles[0].business_name || 'el profesional';
        }
      }

      if (!professionalId) continue;
      clientId = senderIds.find(id => id !== professionalId);
      if (!clientId) continue;

      // Verificar al menos 1 mensaje de cada lado
      const clientMsgs = msgs.filter(m => m.sender_id === clientId);
      const proMsgs = msgs.filter(m => m.sender_id === professionalId);
      if (clientMsgs.length === 0 || proMsgs.length === 0) continue;

      // ¿Ya existe una review?
      const existingReviews = await base44.asServiceRole.entities.Review.filter({
        professional_id: professionalId,
        client_id: clientId
      });
      if (existingReviews.length > 0) continue;

      // ¿Ya enviamos review_request? Buscar messages tipo review_request en esta conv
      const reviewRequests = msgs.filter(m => m.sender_id === 'support_team' && m.content?.includes('review_request_type'));
      const requestCount = reviewRequests.length;

      if (requestCount >= 3) continue; // máx 3 intentos

      // ¿El último request fue hace menos de 5 días?
      if (requestCount > 0) {
        const lastRequest = reviewRequests[reviewRequests.length - 1];
        const daysSinceLast = (now - new Date(lastRequest.created_date)) / (1000 * 60 * 60 * 24);
        const minDays = requestCount === 1 ? 5 : 10;
        if (daysSinceLast < minDays) continue;
      }

      processed++;

      // Determinar nombre del cliente
      let clientName = msgWithClientName?.client_name || 'cliente';

      // Generar mensaje de review request
      const requestNumber = requestCount + 1;
      const requestMessage = requestNumber === 1
        ? `Hola! 👋 ¿Qué tal te fue con **${businessName}**?\n\nTu opinión ayuda a otros clientes a elegir bien y ayuda a ${businessName} a seguir creciendo.\n\n¿Tienes 2 minutos para dejar una valoración? 🌟\n\n[Dejar reseña →](/mi-perfil)<!-- review_request_type -->`
        : `¡Hola de nuevo! Nos gustaría saber cómo fue tu experiencia con **${businessName}**. Solo tarda 1 minuto valorarles. 🙏\n\n[Dejar reseña →](/mi-perfil)<!-- review_request_type -->`;

      // Enviar Message al cliente
      await base44.asServiceRole.entities.Message.create({
        conversation_id: conv.convId,
        sender_id: 'support_team',
        recipient_id: clientId,
        content: requestMessage,
        professional_name: businessName,
        client_name: clientName,
        sender_name: 'MisAutónomos',
        is_read: false,
        attachments: [],
      }).catch(() => {});

      // Enviar Notification al cliente
      await base44.asServiceRole.entities.Notification.create({
        user_id: clientId,
        type: 'review_request',
        title: `¿Cómo te fue con ${businessName}?`,
        message: `Tu opinión ayuda a otros clientes. ¿Tienes 2 minutos para valorar a ${businessName}?`,
        is_read: false,
        action_url: '/mi-perfil',
      }).catch(() => {});

      sent++;
    }

    return Response.json({ ok: true, processed, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});