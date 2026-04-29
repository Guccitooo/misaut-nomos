import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('svix-signature');
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');

    if (!webhookSecret || !signature) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar firma Svix (formato: "v1,<timestamp>,<signature>")
    const [version, timestamp, hash] = signature.split(',');
    const signedContent = `${timestamp}.${body}`;
    
    const expectedHash = createHmac('sha256', webhookSecret)
      .update(signedContent)
      .digest('base64');

    if (hash !== expectedHash) {
      console.warn('Invalid webhook signature');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const payload = JSON.parse(body);
    const { type, data } = payload;

    const messageId = data.email?.headers?.['x-resend-id'] || data.email?.id;

    if (!messageId) {
      return Response.json({ ok: true });
    }

    // Buscar EmailLog por resend_message_id
    const logs = await base44.asServiceRole.entities.EmailLog.filter({
      resend_message_id: messageId
    });

    if (!logs || logs.length === 0) {
      return Response.json({ ok: true });
    }

    const log = logs[0];
    const updateData = {};

    // Mapear eventos Resend
    switch (type) {
      case 'email.delivered':
        updateData.status = 'delivered';
        updateData.delivered_at = new Date().toISOString();
        break;
      case 'email.opened':
        // Solo actualizar si no está abierto ya
        if (log.status !== 'opened' && log.status !== 'clicked') {
          updateData.status = 'opened';
          updateData.opened_at = new Date().toISOString();
        }
        break;
      case 'email.clicked':
        // Marcar como clicked (supercede opened)
        if (log.status !== 'clicked') {
          updateData.status = 'clicked';
          updateData.clicked_at = new Date().toISOString();
        }
        break;
      case 'email.bounced':
        updateData.status = 'bounced';
        updateData.bounced_at = new Date().toISOString();
        break;
      case 'email.complained':
        // Spam complaint: marcar como spam y unsubscribir automáticamente
        updateData.status = 'spam';
        updateData.complained_at = new Date().toISOString();

        // Unsubscribir al usuario
        const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
          email: log.to_email
        });
        if (subscribers && subscribers.length > 0) {
          await base44.asServiceRole.entities.NewsletterSubscriber.update(subscribers[0].id, {
            status: 'unsubscribed',
            unsubscribed_at: new Date().toISOString()
          });
        }
        break;
      default:
        return Response.json({ ok: true });
    }

    // Actualizar EmailLog
    if (Object.keys(updateData).length > 0) {
      await base44.asServiceRole.entities.EmailLog.update(log.id, updateData);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Resend webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});