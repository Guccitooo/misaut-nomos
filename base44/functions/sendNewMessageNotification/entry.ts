import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';
const ONESIGNAL_APP_ID = 'e178adb2-38e8-4397-9239-833be611ed27';
const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

async function sendPush(recipientId, title, message, url) {
  const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
  if (!apiKey) return;

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    include_aliases: { external_id: [recipientId] },
    target_channel: 'push',
    headings: { en: title, es: title },
    contents: { en: message, es: message },
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
    console.error('OneSignal push error:', JSON.stringify(result));
  } else {
    console.log(`Push enviado a ${recipientId}: ${result.id}, recipients: ${result.recipients}`);
  }
}

/**
 * Enviar notificación de nuevo mensaje por email
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { recipientId, senderId, senderName, messagePreview, conversationId } = await req.json();

    if (!recipientId || !senderId) {
      return Response.json({ error: 'Missing recipientId or senderId' }, { status: 400 });
    }

    // Obtener datos del destinatario
    const recipients = await base44.asServiceRole.entities.User.filter({ id: recipientId });
    if (recipients.length === 0) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }
    const recipient = recipients[0];
    const recipientName = recipient.full_name || recipient.email.split('@')[0];

    // Obtener nombre del remitente si no se pasó
    let displaySenderName = senderName;
    if (!displaySenderName) {
      const senders = await base44.asServiceRole.entities.User.filter({ id: senderId });
      if (senders.length > 0) {
        // Buscar perfil profesional si existe
        const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: senderId });
        displaySenderName = profiles[0]?.business_name || senders[0].full_name || senders[0].email.split('@')[0];
      } else {
        displaySenderName = 'Un usuario';
      }
    }

    const conversationUrl = conversationId 
      ? `https://misautonomos.es/mensajes?conversation=${conversationId}`
      : 'https://misautonomos.es/mensajes';

    const preview = messagePreview 
      ? (messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview)
      : 'Tienes un nuevo mensaje';

    // Enviar notificación push via OneSignal (fire-and-forget)
    sendPush(
      recipientId,
      `💬 Mensaje de ${displaySenderName}`,
      preview,
      conversationUrl
    ).catch(e => console.error('Push error (non-fatal):', e.message));

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient.email,
      subject: `💬 Nuevo mensaje de ${displaySenderName}`,
      body: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 36px 20px; text-align: center; }
    .logo { width: 56px; height: 56px; margin: 0 auto 12px; }
    .logo img { width: 100%; height: 100%; border-radius: 12px; }
    .header h1 { color: white; margin: 0; font-size: 20px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 14px; }
    .content { padding: 36px 28px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 16px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.6; font-size: 15px; margin-bottom: 20px; }
    .message-box { background: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .message-box p { color: #374151; margin: 0; font-style: italic; font-size: 15px; }
    .cta { text-align: center; margin: 28px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 12px; line-height: 1.5; }
    .footer a { color: #60a5fa; text-decoration: none; }
    .small-text { font-size: 12px; color: #6b7280; text-align: center; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><img src="${LOGO_URL}" alt="MisAutónomos" /></div>
      <h1>💬 Nuevo mensaje</h1>
      <p>Tienes un mensaje en MisAutónomos</p>
    </div>

    <div class="content">
      <p class="greeting">Hola ${recipientName},</p>
      
      <p class="message">
        <strong>${displaySenderName}</strong> te ha enviado un mensaje:
      </p>
      
      <div class="message-box">
        <p>"${preview}"</p>
      </div>
      
      <div class="cta">
        <a href="${conversationUrl}" class="button">
          Ver mensaje completo →
        </a>
      </div>
      
      <p class="small-text">
        Responde rápido para mejorar tu posición en las búsquedas.
      </p>
    </div>

    <div class="footer">
      <strong style="color: #fff;">MisAutónomos</strong> · Tu autónomo de confianza<br/><br/>
      <a href="https://misautonomos.es">misautonomos.es</a> · <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a>
    </div>
  </div>
</body>
</html>
      `,
      from_name: "MisAutónomos"
    });

    return Response.json({ 
      ok: true,
      message: 'Notification email sent'
    });

  } catch (error) {
    console.error('Error sending message notification:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});