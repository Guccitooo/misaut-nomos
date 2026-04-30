import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = 'Equipo Plan Ads+ <hola@misautonomos.es>';
const EMAIL_REPLY_TO = 'hola@misautonomos.es';
const APP_URL = Deno.env.get('VITE_APP_URL') || 'https://misautonomos.es';

/**
 * Anonimiza el nombre del remitente según el tipo de chat
 */
function getSenderDisplayName(sender, chatCategory = 'ads_briefing') {
  if (!sender) return 'Un usuario';
  const isAdmin = sender.role === 'admin' || sender.is_admin === true;
  if (isAdmin) {
    return chatCategory === 'ads_briefing' ? 'Equipo Plan Ads+' : 'Equipo MisAutónomos';
  }
  return sender.full_name || 'Un usuario';
}

/**
 * Envía notificación por email cuando el admin envía un mensaje en chat de Briefing Ads+
 * Se dispara con delay de 5 minutos para agrupar múltiples mensajes en un solo email
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Payload de la automación entity (Message)
    const { event, data } = body;

    // Solo procesar eventos de creación de mensajes
    if (event?.type !== 'create') {
      return Response.json({ ok: true, skipped: 'not_create' });
    }

    const msg = data;
    if (!msg?.recipient_id || !msg?.sender_id || !msg?.content) {
      return Response.json({ ok: true, skipped: 'invalid_message' });
    }

    // Detectar si es mensaje del admin (sender_name == "Equipo Plan Ads+" o similar)
    const isAdminMessage = msg.sender_name?.includes('Equipo') || msg.sender_name?.includes('Plan Ads+');
    if (!isAdminMessage) {
      return Response.json({ ok: true, skipped: 'not_admin_message' });
    }

    // Obtener datos del profesional destinatario
    const recipientUsers = await base44.asServiceRole.entities.User.filter({
      id: msg.recipient_id
    });
    const recipient = recipientUsers?.[0];

    if (!recipient?.email) {
      return Response.json({ ok: true, skipped: 'no_recipient_email' });
    }

    // Obtener nombre a mostrar del remitente (anónimo si es admin)
    const senderDisplayName = getSenderDisplayName(msg.sender_obj || { role: 'admin' }, 'ads_briefing');

    // Generar preview del mensaje (primeros 50 caracteres)
    const messagePreview = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');

    // URL del chat de Briefing Ads+ para este profesional
    const ctaUrl = `${APP_URL}/mi-campana/briefing`;

    // HTML del email
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo mensaje del Equipo Plan Ads+</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <tr><td style="padding:24px 32px;background:linear-gradient(135deg, #2563eb 0%, #1e40af 100%);color:white;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">⚡ Equipo Plan Ads+</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1f2937;">${senderDisplayName} tiene un mensaje para ti 💬</h2>
          
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4b5563;">
            Hola ${recipient.full_name || 'Profesional'},
          </p>

          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4b5563;">
            ${senderDisplayName} te ha enviado un mensaje sobre tu campaña publicitaria:
          </p>

          <!-- Message Preview -->
          <div style="background:#f3f4f6;border-left:4px solid #2563eb;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;word-wrap:break-word;">
              "${msg.content}"
            </p>
          </div>

          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
            Accede a tu campaña para ver el mensaje completo y responder al equipo.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${ctaUrl}" style="display:inline-block;background:#2563eb;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
              Ver mensaje
            </a>
          </div>

          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
            No necesitas responder este email. Accede a la plataforma para responder directamente.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
          <p style="margin:0;">© 2026 MisAutónomos | Barcelona, España</p>
          <p style="margin:8px 0 0;">Este es un email transaccional de tu Plan Ads+. No se puede dar de baja.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Enviar email con Resend
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY no configurada');
      return Response.json({ ok: true, skipped: 'no_resend_key' });
    }

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        reply_to: EMAIL_REPLY_TO,
        to: recipient.email,
        subject: 'Tienes un mensaje nuevo del Equipo Plan Ads+ 💬',
        html,
        headers: {
          'X-Entity-Ref': msg.conversation_id || msg.id,
          'List-Unsubscribe': `<${APP_URL}/newsletter/unsubscribe?email=${recipient.email}>`
        }
      })
    });

    if (!resendResp.ok) {
      const error = await resendResp.json();
      console.error('Email send failed:', error);
      return Response.json({ ok: true, status: 'email_failed' }, { status: 200 });
    }

    const result = await resendResp.json();
    console.log(`✅ Email sent to ${recipient.email} for Ads+ message:`, result.id);

    return Response.json({ 
      ok: true, 
      status: 'email_sent',
      messageId: result.id,
      recipient: recipient.email
    });

  } catch (error) {
    console.error('notifyAdsPlusMessage error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});