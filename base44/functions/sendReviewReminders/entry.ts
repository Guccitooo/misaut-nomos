import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON JOB: Enviar recordatorios de reseñas
 * Ejecutar cada 6h. Detecta conversaciones bidireccionales con >48h sin actividad
 * y envía email al cliente si aún no ha dejado reseña.
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        console.log('📬 Iniciando envío de recordatorios de reseñas (48h)');

        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Obtener mensajes en el rango de 48h–7días (evitar demasiado antiguos)
        const allMessages = await base44.asServiceRole.entities.Message.list('-created_date', 2000);

        const relevantMessages = allMessages.filter(msg => {
            const d = new Date(msg.created_date);
            return d <= fortyEightHoursAgo && d >= sevenDaysAgo;
        });

        console.log(`📊 Mensajes en rango 48h-7días: ${relevantMessages.length}`);

        // Agrupar por conversation_id y guardar última fecha
        const conversations = {};
        relevantMessages.forEach(msg => {
            const cid = msg.conversation_id;
            if (!conversations[cid]) {
                conversations[cid] = { messages: [], participants: new Set(), lastDate: new Date(0) };
            }
            conversations[cid].messages.push(msg);
            conversations[cid].participants.add(msg.sender_id);
            conversations[cid].participants.add(msg.recipient_id);
            const d = new Date(msg.created_date);
            if (d > conversations[cid].lastDate) conversations[cid].lastDate = d;
        });

        let remindersSent = 0;

        for (const [convId, conv] of Object.entries(conversations)) {
            const participants = Array.from(conv.participants);
            if (participants.length !== 2) continue;

            // Verificar bidireccional
            const [u1, u2] = participants;
            const u1Sent = conv.messages.some(m => m.sender_id === u1);
            const u2Sent = conv.messages.some(m => m.sender_id === u2);
            if (!u1Sent || !u2Sent) continue;

            // Obtener usuarios
            const users = await base44.asServiceRole.entities.User.list();
            const filteredUsers = users.filter(u => participants.includes(u.id));

            const client = filteredUsers.find(u => u.user_type === 'client');
            const professional = filteredUsers.find(u => u.user_type === 'professionnel');

            if (!client || !professional) continue;

            // Verificar si ya existe reseña
            const existingReviews = await base44.asServiceRole.entities.Review.filter({
                client_id: client.id,
                professional_id: professional.id
            });
            if (existingReviews.length > 0) continue;

            // Obtener perfil profesional
            const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
                user_id: professional.id
            });
            const profile = profiles[0];
            if (!profile?.business_name) continue;

            // Enviar email
            const reviewLink = `https://misautonomos.es/autonomo/${profile.slug_publico || professional.id}`;

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: client.email,
                subject: `⭐ ¿Qué tal tu experiencia con ${profile.business_name}?`,
                from_name: "MisAutónomos",
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
      <p class="message">Hace dos días contactaste con <strong>${profile.business_name}</strong> en MisAutónomos.</p>
      <div class="pro-box">
        <p style="margin:0;color:#78350f;font-weight:600;">👤 ${profile.business_name}</p>
        <p style="margin:4px 0 0;color:#78350f;font-size:14px;">Categoría: ${profile.categories?.[0] || 'Profesional'}</p>
      </div>
      <p class="message">¿Qué tal fue tu experiencia? Tu valoración ayuda a otros usuarios y al profesional a mejorar.</p>
      <p class="message">Solo te llevará 2 minutos:</p>
      <ul style="color:#4b5563;line-height:2;">
        <li>⚡ Rapidez de respuesta</li>
        <li>💬 Calidad de comunicación</li>
        <li>✨ Calidad del trabajo</li>
        <li>💰 Relación calidad/precio</li>
      </ul>
      <div class="cta">
        <a href="${reviewLink}" class="button">Dejar mi valoración →</a>
      </div>
      <p style="font-size:13px;color:#9ca3af;text-align:center;">Si no quieres recibir estos emails, ignora este mensaje.</p>
    </div>
    <div class="footer">
      <strong style="color:#fff;">MisAutónomos</strong><br>
      <a href="https://misautonomos.es">misautonomos.es</a>
    </div>
  </div>
</body>
</html>`
            });

            // Notificación interna
            await base44.asServiceRole.entities.Notification.create({
                user_id: client.id,
                type: 'review_reminder',
                title: '⭐ Valora tu experiencia',
                message: `¿Qué tal tu experiencia con ${profile.business_name}? Tu opinión ayuda a la comunidad.`,
                link: reviewLink,
                priority: 'medium',
            }).catch(() => {});

            remindersSent++;
            console.log(`✅ Recordatorio enviado a ${client.email} sobre ${profile.business_name}`);
        }

        console.log(`📬 Total recordatorios enviados: ${remindersSent}`);

        return Response.json({ ok: true, remindersSent, timestamp: now.toISOString() });

    } catch (error) {
        console.error('❌ Error enviando recordatorios:', error);
        return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
});