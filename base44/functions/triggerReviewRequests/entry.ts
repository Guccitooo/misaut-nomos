import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON: Trigger diario de review requests.
 *
 * Reglas de idempotencia:
 * - Máx 3 envíos por par (client_id, professional_id)
 * - Envío 1: cumple condiciones base (3+ msgs bidireccionales, 7+ días desde el primero, sin Review)
 * - Envío 2: solo si han pasado 5+ días desde el envío 1 y sigue sin Review
 * - Envío 3: solo si han pasado 5+ días desde el envío 2 y sigue sin Review
 * - Tabla ReviewRequest con índice único (client_id, professional_id) previene duplicados de raíz
 * - Canales: Message in-app SIEMPRE + Notification SIEMPRE
 * - Email: solo si han pasado 48h y el cliente no leyó el Message (lo maneja sendReviewReminders)
 * - El link es /valorar/:professionalId — NO /mi-perfil
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

    console.log('[triggerReviewRequests] Iniciando run:', now.toISOString());

    // Cargar todos los mensajes de usuarios reales (excluye support_team)
    const allMessages = await base44.asServiceRole.entities.Message.filter({});
    const userMessages = allMessages.filter(m => m.sender_id && m.sender_id !== 'support_team');

    // Agrupar por conversation_id
    const convMap = {};
    for (const msg of userMessages) {
      if (!msg.conversation_id) continue;
      if (!convMap[msg.conversation_id]) {
        convMap[msg.conversation_id] = { messages: [], convId: msg.conversation_id };
      }
      convMap[msg.conversation_id].messages.push(msg);
    }

    let processed = 0;
    let sent = 0;
    let skipped = 0;

    for (const conv of Object.values(convMap)) {
      const msgs = conv.messages;
      if (msgs.length < 3) continue;

      msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const firstDate = new Date(msgs[0].created_date);

      // Condición base: 7+ días desde el primer mensaje
      if (now - firstDate < 7 * 24 * 60 * 60 * 1000) continue;

      // Identificar participantes
      const senderIds = [...new Set(msgs.map(m => m.sender_id))];
      if (senderIds.length < 2) continue;

      // Necesitamos saber quién es pro y quién es cliente
      let professionalId = null;
      let businessName = null;
      let proProfile = null;

      for (const uid of senderIds) {
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: uid });
        if (profiles[0]) {
          professionalId = uid;
          proProfile = profiles[0];
          businessName = profiles[0].business_name || 'el profesional';
          break;
        }
      }

      if (!professionalId || !proProfile) continue;

      const clientId = senderIds.find(id => id !== professionalId);
      if (!clientId) continue;

      // Verificar mensajes bidireccionales
      const clientMsgs = msgs.filter(m => m.sender_id === clientId);
      const proMsgs = msgs.filter(m => m.sender_id === professionalId);
      if (clientMsgs.length === 0 || proMsgs.length === 0) continue;

      processed++;

      // Verificar si ya existe una review real
      const existingReviews = await base44.asServiceRole.entities.Review.filter({
        professional_id: professionalId,
        client_id: clientId
      });
      if (existingReviews.length > 0) {
        // Marcar como completado si existe registro
        const existingRR = await base44.asServiceRole.entities.ReviewRequest.filter({
          client_id: clientId,
          professional_id: professionalId
        });
        if (existingRR[0] && !existingRR[0].completed) {
          await base44.asServiceRole.entities.ReviewRequest.update(existingRR[0].id, { completed: true });
        }
        continue;
      }

      // Obtener o crear ReviewRequest (índice único previene duplicados)
      let rr = null;
      const existingRR = await base44.asServiceRole.entities.ReviewRequest.filter({
        client_id: clientId,
        professional_id: professionalId
      });
      rr = existingRR[0] || null;

      // Decidir si enviar
      let shouldSend = false;

      if (!rr) {
        // Primer envío — no hay registro previo
        shouldSend = true;
      } else if (rr.completed) {
        // Ya completó la review
        continue;
      } else if (rr.sent_count >= 3) {
        // Máximo alcanzado
        skipped++;
        continue;
      } else {
        // Envíos 2 y 3: comprobar 5 días desde el último
        const lastSent = new Date(rr.last_sent_at);
        const daysSinceLast = (now - lastSent) / fiveDaysMs;
        if (daysSinceLast >= 1) {
          shouldSend = true;
        } else {
          skipped++;
          continue;
        }
      }

      if (!shouldSend) continue;

      // Generar token único para el link de review
      const token = crypto.randomUUID();
      const tokenExpiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

      const reviewLink = `https://misautonomos.es/valorar/${professionalId}`;
      const newSentCount = (rr?.sent_count || 0) + 1;

      // Mensaje limpio — SIN comentarios HTML, SIN markdown, link correcto
      const messageContent = newSentCount === 1
        ? `¡Hola! 👋 ¿Qué tal te fue con ${businessName}?\n\nTu opinión ayuda a otros clientes a elegir bien y ayuda a ${businessName} a seguir creciendo.\n\n¿Tienes 2 minutos para dejar una valoración? 🌟\n\nDejar reseña → ${reviewLink}`
        : `¡Hola de nuevo! Nos gustaría saber cómo fue tu experiencia con ${businessName}. Solo tarda 1 minuto valorarles. 🙏\n\nDejar reseña → ${reviewLink}`;

      const nowIso = now.toISOString();

      // Crear o actualizar ReviewRequest ANTES de enviar (evita duplicados si el proceso falla a mitad)
      if (!rr) {
        await base44.asServiceRole.entities.ReviewRequest.create({
          client_id: clientId,
          professional_id: professionalId,
          conversation_id: conv.convId,
          sent_count: 1,
          last_sent_at: nowIso,
          first_sent_at: nowIso,
          review_token: token,
          token_expires_at: tokenExpiresAt,
          completed: false
        });
      } else {
        await base44.asServiceRole.entities.ReviewRequest.update(rr.id, {
          sent_count: newSentCount,
          last_sent_at: nowIso,
          review_token: token,
          token_expires_at: tokenExpiresAt
        });
      }

      // Enviar Message in-app (sin HTML comments, sin markdown)
      await base44.asServiceRole.entities.Message.create({
        conversation_id: conv.convId,
        sender_id: 'support_team',
        recipient_id: clientId,
        content: messageContent,
        professional_name: businessName,
        sender_name: 'MisAutónomos',
        is_read: false,
        attachments: [],
        metadata: { type: 'review_request', professional_id: professionalId, token }
      }).catch(e => console.warn('[triggerReviewRequests] Error creando Message:', e.message));

      // Enviar Notification in-app
      await base44.asServiceRole.entities.Notification.create({
        user_id: clientId,
        type: 'review_request',
        title: `¿Cómo te fue con ${businessName}?`,
        message: `Tu opinión ayuda a otros clientes. ¿Tienes 2 minutos para valorar a ${businessName}?`,
        is_read: false,
        action_url: reviewLink,
      }).catch(e => console.warn('[triggerReviewRequests] Error creando Notification:', e.message));

      sent++;
      console.log(`[triggerReviewRequests] ✅ Enviado (${newSentCount}/3): client=${clientId}, pro=${professionalId}`);
    }

    console.log(`[triggerReviewRequests] Procesados: ${processed}, enviados: ${sent}, omitidos: ${skipped}`);
    return Response.json({ ok: true, processed, sent, skipped, timestamp: now.toISOString() });

  } catch (error) {
    console.error('[triggerReviewRequests] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});