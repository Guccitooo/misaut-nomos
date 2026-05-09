import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON: Enviar email de review request SOLO si:
 * - Han pasado 48h desde el in-app Message
 * - El cliente NO ha leído el Message (is_read = false)
 * - No se envió email ya para este ReviewRequest (email_sent_at is null)
 * - El ReviewRequest no está completado
 *
 * Este cron es SECUNDARIO — no envía in-app, solo el email diferido.
 * También envía mensajes de disculpa a clientes que recibieron spam.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    console.log('[sendReviewReminders] Iniciando run:', now.toISOString());

    // Buscar ReviewRequests pendientes de email (enviado hace 48h+, sin email aún, no completados)
    const pendingRRs = await base44.asServiceRole.entities.ReviewRequest.filter({
      completed: false
    });

    let emailsSent = 0;
    let apologyMessagesSent = 0;

    for (const rr of pendingRRs) {
      // Solo procesar los que ya tienen last_sent_at y no tienen email_sent_at
      if (!rr.last_sent_at || rr.email_sent_at) continue;

      const lastSent = new Date(rr.last_sent_at);
      if (lastSent > fortyEightHoursAgo) continue; // Aún no han pasado 48h

      // Verificar que el in-app Message no fue leído
      const recentMessages = await base44.asServiceRole.entities.Message.filter({
        recipient_id: rr.client_id,
        sender_id: 'support_team'
      });

      const reviewMsg = recentMessages.find(m =>
        m.metadata?.type === 'review_request' &&
        m.metadata?.professional_id === rr.professional_id &&
        !m.is_read
      );

      if (!reviewMsg) continue; // Ya lo leyó, no enviar email

      // Verificar que sigue sin Review
      const existingReviews = await base44.asServiceRole.entities.Review.filter({
        professional_id: rr.professional_id,
        client_id: rr.client_id
      });
      if (existingReviews.length > 0) {
        await base44.asServiceRole.entities.ReviewRequest.update(rr.id, { completed: true });
        continue;
      }

      // Obtener datos del profesional y cliente
      const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
        user_id: rr.professional_id
      });
      const profile = profiles[0];
      if (!profile?.business_name) continue;

      const clientUsers = await base44.asServiceRole.entities.User.filter({ id: rr.client_id });
      const clientUser = clientUsers[0];
      if (!clientUser?.email) continue;

      const reviewLink = `https://misautonomos.es/valorar/${rr.professional_id}`;
      const businessName = profile.business_name;

      // Enviar email HTML
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: clientUser.email,
        subject: `⭐ ¿Qué tal tu experiencia con ${businessName}?`,
        from_name: 'MisAutónomos',
        body: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f8fafc; }
    .container { max-width:600px; margin:0 auto; background:#fff; }
    .header { background:linear-gradient(135deg,#f59e0b,#fbbf24); padding:40px 20px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:26px; font-weight:700; }
    .content { padding:40px 30px; }
    .message { color:#4b5563; line-height:1.8; font-size:16px; margin-bottom:20px; }
    .pro-box { background:#fffbeb; border-left:4px solid #f59e0b; padding:16px 20px; margin:20px 0; border-radius:8px; }
    .cta { text-align:center; margin:30px 0; }
    .button { display:inline-block; background:#f59e0b; color:#fff; padding:14px 36px; text-decoration:none; border-radius:10px; font-weight:700; font-size:16px; }
    .stars { font-size:28px; letter-spacing:4px; margin:10px 0; }
    .footer { background:#1f2937; color:#9ca3af; padding:30px; text-align:center; font-size:13px; }
    .footer a { color:#60a5fa; text-decoration:none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="stars">⭐⭐⭐⭐⭐</div>
      <h1>Valora tu experiencia</h1>
    </div>
    <div class="content">
      <p class="message">Hola,</p>
      <p class="message">Hace unos días contactaste con <strong>${businessName}</strong> en MisAutónomos.</p>
      <div class="pro-box">
        <p style="margin:0;color:#78350f;font-weight:600;">👤 ${businessName}</p>
        <p style="margin:4px 0 0;color:#78350f;font-size:14px;">Categoría: ${profile.categories?.[0] || 'Profesional'}</p>
      </div>
      <p class="message">¿Qué tal fue tu experiencia? Tu valoración ayuda a otros usuarios y al profesional a mejorar.</p>
      <div class="cta">
        <a href="${reviewLink}" class="button">Dejar mi valoración →</a>
      </div>
      <p style="font-size:13px;color:#9ca3af;text-align:center;">Si no quieres recibir más emails de este tipo, simplemente ignora este mensaje.</p>
    </div>
    <div class="footer">
      <strong style="color:#fff;">MisAutónomos</strong><br>
      <a href="https://misautonomos.es">misautonomos.es</a>
    </div>
  </div>
</body>
</html>`
      }).catch(e => console.warn('[sendReviewReminders] Error enviando email:', e.message));

      // Marcar email_sent_at para no reenviar
      await base44.asServiceRole.entities.ReviewRequest.update(rr.id, {
        email_sent_at: now.toISOString()
      });

      emailsSent++;
      console.log(`[sendReviewReminders] ✅ Email enviado a ${clientUser.email} para pro=${rr.professional_id}`);
    }

    // ── MENSAJE DE DISCULPA ──────────────────────────────────────────────────────
    // Detectar clientes que recibieron 2+ review requests en los últimos 7 días del mismo pro
    // Solo se envía UNA vez: verificar que no exista ya un mensaje de disculpa (metadata.type = review_apology)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentSupportMessages = await base44.asServiceRole.entities.Message.filter({
      sender_id: 'support_team'
    });

    // Agrupar por (recipient_id, professional_id) los mensajes de tipo review_request
    const spamMap = {};
    for (const msg of recentSupportMessages) {
      if (!msg.metadata?.type || msg.metadata.type !== 'review_request') continue;
      if (new Date(msg.created_date) < sevenDaysAgo) continue;
      const key = `${msg.recipient_id}_${msg.metadata.professional_id}`;
      spamMap[key] = spamMap[key] || [];
      spamMap[key].push(msg);
    }

    for (const [key, msgs] of Object.entries(spamMap)) {
      if (msgs.length < 2) continue;

      const [clientId, professionalId] = key.split('_');

      // ¿Ya enviamos disculpa?
      const alreadyApologized = recentSupportMessages.some(m =>
        m.recipient_id === clientId &&
        m.metadata?.type === 'review_apology' &&
        m.metadata?.professional_id === professionalId
      );
      if (alreadyApologized) continue;

      const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: professionalId });
      const profile = profiles[0];
      const reviewLink = `https://misautonomos.es/valorar/${professionalId}`;
      const businessName = profile?.business_name || 'el profesional';

      const convId = msgs[0].conversation_id;

      await base44.asServiceRole.entities.Message.create({
        conversation_id: convId,
        sender_id: 'support_team',
        recipient_id: clientId,
        content: `Hola 👋 Detectamos que recibiste varios mensajes repetidos pidiéndote una reseña sobre ${businessName}. Lo sentimos — ya está corregido.\n\nSi quieres dejar tu opinión, aquí tienes el enlace correcto: ${reviewLink}\n\nGracias por tu paciencia. — Equipo MisAutónomos`,
        sender_name: 'MisAutónomos',
        is_read: false,
        attachments: [],
        metadata: { type: 'review_apology', professional_id: professionalId }
      }).catch(e => console.warn('[sendReviewReminders] Error enviando disculpa:', e.message));

      apologyMessagesSent++;
      console.log(`[sendReviewReminders] ✅ Mensaje de disculpa enviado: client=${clientId}, pro=${professionalId}`);
    }

    console.log(`[sendReviewReminders] emailsSent=${emailsSent}, apologies=${apologyMessagesSent}`);
    return Response.json({ ok: true, emailsSent, apologyMessagesSent, timestamp: now.toISOString() });

  } catch (error) {
    console.error('[sendReviewReminders] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});