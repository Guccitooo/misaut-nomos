import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ONESIGNAL_APP_ID = 'e178adb2-38e8-4397-9239-833be611ed27';
const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

async function sendPush(recipientId, title, body, url) {
  const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
  if (!apiKey) {
    console.warn('ONESIGNAL_REST_API_KEY no configurada — push omitido');
    return;
  }

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    include_aliases: { external_id: [recipientId] },
    target_channel: 'push',
    headings: { en: title, es: title },
    contents: { en: body, es: body },
    url: url || 'https://misautonomos.es/mensajes',
    chrome_web_icon: 'https://misautonomos.es/logo-192.png',
    ttl: 86400,
  };

  const res = await fetch(ONESIGNAL_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  if (!res.ok) {
    console.error('OneSignal error:', JSON.stringify(result));
  } else {
    console.log(`Push enviado a ${recipientId}: recipients=${result.recipients}`);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Payload de la automación entity
    const { event, data } = body;

    // Solo procesar eventos de creación de mensajes
    if (event?.type !== 'create') {
      return Response.json({ ok: true, skipped: 'not_create' });
    }

    const msg = data;
    if (!msg?.recipient_id || !msg?.sender_id || !msg?.content) {
      return Response.json({ ok: true, skipped: 'invalid_message' });
    }

    // Obtener nombre del remitente
    let senderName = msg.professional_name || msg.client_name || 'Alguien';

    // Intentar obtener nombre real del perfil profesional
    if (!senderName || senderName === 'Alguien') {
      try {
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: msg.sender_id });
        if (profiles[0]?.business_name) {
          senderName = profiles[0].business_name;
        } else {
          const users = await base44.asServiceRole.entities.User.filter({ id: msg.sender_id });
          if (users[0]?.full_name) senderName = users[0].full_name;
        }
      } catch (e) {
        console.warn('Could not resolve sender name:', e.message);
      }
    }

    const preview = msg.content?.length > 80 ? msg.content.slice(0, 80) + '...' : (msg.content || '🎤 Mensaje de voz');
    const convUrl = msg.conversation_id
      ? `https://misautonomos.es/mensajes?conv=${msg.conversation_id}`
      : 'https://misautonomos.es/mensajes';

    // Crear notificación en BD
    base44.asServiceRole.entities.Notification.create({
      user_id: msg.recipient_id,
      type: 'new_message',
      title: `💬 Mensaje de ${senderName}`,
      message: preview,
      link: convUrl,
      is_read: false,
      priority: 'medium',
      metadata: { conversationId: msg.conversation_id, senderId: msg.sender_id },
    }).catch(e => console.error('Notification create error:', e.message));

    // Enviar push
    await sendPush(
      msg.recipient_id,
      `💬 Mensaje de ${senderName}`,
      preview,
      convUrl
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error('onNewMessage error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});