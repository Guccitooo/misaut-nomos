import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');

// Verificación de firma Svix (usada por Resend)
async function verifyWebhookSignature(req, body) {
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Verificar que el timestamp no sea más de 5 min viejo (replay attack)
  const ts = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) {
    console.warn('[resend-webhook] Timestamp demasiado viejo:', svixTimestamp);
    return false;
  }

  // Calcular firma esperada: HMAC-SHA256 de "<svix-id>.<svix-timestamp>.<body>"
  const toSign = `${svixId}.${svixTimestamp}.${body}`;
  const secretBytes = Uint8Array.from(atob(RESEND_WEBHOOK_SECRET.replace('whsec_', '')), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(toSign));
  const computedSig = 'v1,' + btoa(String.fromCharCode(...new Uint8Array(signature)));

  // svix-signature puede tener múltiples firmas separadas por espacio
  const signatures = svixSignature.split(' ');
  return signatures.some(sig => sig === computedSig);
}

// Mapa de tipo de evento → campos a actualizar en EmailLog
function getEmailLogUpdate(eventType, createdAt, currentLog) {
  const STATUS_PRIORITY = { queued: 0, sent: 1, delivered: 2, opened: 3, clicked: 4, bounced: 5, spam: 5, failed: 5 };
  const currentPriority = STATUS_PRIORITY[currentLog?.status] ?? 0;

  switch (eventType) {
    case 'email.delivered': {
      if (currentPriority >= STATUS_PRIORITY.delivered) return { delivered_at: createdAt }; // solo actualiza fecha
      return { delivered_at: createdAt, status: 'delivered' };
    }
    case 'email.opened': {
      const update = {};
      if (!currentLog?.opened_at) update.opened_at = createdAt;
      if (currentPriority < STATUS_PRIORITY.opened) update.status = 'opened';
      return Object.keys(update).length ? update : null;
    }
    case 'email.clicked': {
      const update = {};
      if (!currentLog?.clicked_at) update.clicked_at = createdAt;
      if (currentPriority < STATUS_PRIORITY.clicked) update.status = 'clicked';
      return Object.keys(update).length ? update : null;
    }
    case 'email.bounced':
      return { bounced_at: createdAt, status: 'bounced', error_message: 'Bounce' };
    case 'email.complained':
      return { complained_at: createdAt, status: 'spam' };
    case 'email.delivery_delayed':
      // Solo actualizar metadata, no status
      return { metadata: { ...(currentLog?.metadata || {}), delivery_delayed_at: createdAt } };
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const bodyText = await req.text();

  // Verificar firma
  const isValid = await verifyWebhookSignature(req, bodyText);
  if (!isValid) {
    console.warn('[resend-webhook] Firma inválida');
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch (e) {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    const eventType = payload.type; // e.g. "email.delivered"
    const createdAt = payload.created_at || new Date().toISOString();
    const emailId = payload.data?.email_id;
    const toEmail = Array.isArray(payload.data?.to) ? payload.data.to[0] : payload.data?.to;

    // Mapear tipo de evento al enum de ResendEvent
    const eventTypeShort = eventType?.replace('email.', '') || 'sent';

    // 1. Registrar evento crudo en ResendEvent (auditoría)
    let emailLogId = null;
    let emailLog = null;

    if (emailId) {
      // 2. Buscar EmailLog por resend_message_id
      const logs = await base44.asServiceRole.entities.EmailLog.filter({ resend_message_id: emailId });
      emailLog = logs?.[0] || null;

      if (emailLog) {
        emailLogId = emailLog.id;

        // 3. Calcular qué campos actualizar
        const update = getEmailLogUpdate(eventType, createdAt, emailLog);
        if (update) {
          await base44.asServiceRole.entities.EmailLog.update(emailLog.id, update);
          console.log(`[resend-webhook] EmailLog ${emailLog.id} → ${eventType}`);
        }
      } else {
        console.warn('[resend-webhook] Unknown message_id:', emailId);
      }
    }

    // Registrar en ResendEvent (siempre, incluso si no encontramos el EmailLog)
    await base44.asServiceRole.entities.ResendEvent.create({
      resend_message_id: emailId || 'unknown',
      event_type: eventTypeShort,
      to_email: toEmail || '',
      raw_payload: payload,
      received_at: createdAt,
      email_log_id: emailLogId
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[resend-webhook] Error procesando evento:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});