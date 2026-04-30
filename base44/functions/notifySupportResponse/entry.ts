import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = 'Soporte MisAutónomos <soporte@misautonomos.es>';
const EMAIL_REPLY_TO = 'soporte@misautonomos.es';
const APP_URL = Deno.env.get('VITE_APP_URL') || 'https://misautonomos.es';

/**
 * Anonimiza el nombre del remitente según el tipo de chat
 */
function getSenderDisplayName(sender, chatCategory = 'support') {
  if (!sender) return 'Equipo MisAutónomos';
  const isAdmin = sender.role === 'admin' || sender.is_admin === true;
  if (isAdmin) {
    return 'Equipo MisAutónomos';
  }
  return sender.full_name || 'Un usuario';
}

/**
 * Notifica al usuario cuando admin responde en soporte
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    if (event?.type !== 'create') {
      return Response.json({ ok: true, skipped: 'not_create' });
    }

    const msg = data;
    if (!msg?.recipient_id || !msg?.sender_id || !msg?.content) {
      return Response.json({ ok: true, skipped: 'invalid_message' });
    }

    // Obtener datos del sender
    const senders = await base44.asServiceRole.entities.User.filter({
      id: msg.sender_id
    });
    const sender = senders?.[0];

    // Solo notificar si el sender tiene rol admin
    if (sender?.role !== 'admin') {
      return Response.json({ ok: true, skipped: 'sender_not_admin' });
    }

    // Usar nombre anónimo para admin
    const senderDisplayName = getSenderDisplayName(sender, 'support');

    // Obtener datos del usuario destinatario
    const recipientUsers = await base44.asServiceRole.entities.User.filter({
      id: msg.recipient_id
    });
    const recipient = recipientUsers?.[0];

    if (!recipient?.email) {
      return Response.json({ ok: true, skipped: 'no_recipient_email' });
    }

    // URL del ticket de soporte
    const ctaUrl = `${APP_URL}/soporte`;

    // HTML del email
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Respuesta de soporte</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <tr><td style="padding:24px 32px;background:linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);color:white;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">🎟️ Respuesta de Soporte</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1f2937;">Tenemos respuesta para ti</h2>
          
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4b5563;">
            Hola ${recipient.full_name || 'Usuario'},
          </p>

          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4b5563;">
            ${senderDisplayName} ha respondido a tu consulta:
          </p>

          <!-- Message Preview -->
          <div style="background:#f3f4f6;border-left:4px solid #8b5cf6;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;word-wrap:break-word;">
              "${msg.content}"
            </p>
          </div>

          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
            Accede a tu panel de soporte para ver la respuesta completa y continuar la conversación si lo necesitas.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${ctaUrl}" style="display:inline-block;background:#8b5cf6;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
              Ver respuesta
            </a>
          </div>

          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
            Estamos aquí para ayudarte.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
          <p style="margin:0;">© 2026 MisAutónomos | Barcelona, España</p>
          <p style="margin:8px 0 0;">Este es un email transaccional de soporte. No se puede dar de baja.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Enviar email
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
        subject: 'Tenemos respuesta para ti — Soporte MisAutónomos',
        html
      })
    });

    if (!resendResp.ok) {
      const error = await resendResp.json();
      console.error('Email send failed:', error);
      return Response.json({ ok: true, status: 'email_failed' }, { status: 200 });
    }

    const result = await resendResp.json();
    console.log(`✅ Email sent to ${recipient.email} for support response:`, result.id);

    return Response.json({ 
      ok: true, 
      status: 'email_sent',
      messageId: result.id
    });

  } catch (error) {
    console.error('notifySupportResponse error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});