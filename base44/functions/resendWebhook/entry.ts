import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const signature = req.headers.get('x-resend-signature');
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');

    if (!webhookSecret || !signature) {
      console.warn('Missing webhook secret or signature');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar firma
    const bodyStr = JSON.stringify(body);
    const hash = createHmac('sha256', webhookSecret).update(bodyStr).digest('hex');
    if (hash !== signature) {
      console.warn('Invalid webhook signature');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    const { type, data } = body;
    const messageId = data.email?.headers?.['x-resend-id'] || data.email?.id;

    if (!messageId) {
      console.warn('No message ID in webhook');
      return Response.json({ ok: true });
    }

    // Buscar el EmailLog
    const logs = await base44.asServiceRole.entities.EmailLog.filter({
      resend_message_id: messageId
    });

    if (!logs || logs.length === 0) {
      console.warn(`No EmailLog found for message ${messageId}`);
      return Response.json({ ok: true });
    }

    const log = logs[0];
    const updateData = {};

    // Mapear eventos
    switch (type) {
      case 'email.delivered':
        updateData.status = 'delivered';
        updateData.delivered_at = new Date().toISOString();
        break;
      case 'email.opened':
        updateData.status = 'opened';
        updateData.opened_at = new Date().toISOString();
        break;
      case 'email.clicked':
        updateData.status = 'clicked';
        updateData.clicked_at = new Date().toISOString();
        break;
      case 'email.bounced':
        updateData.status = 'bounced';
        updateData.bounced_at = new Date().toISOString();
        break;
      case 'email.complained':
        updateData.status = 'spam';
        // Unsubscribir automáticamente
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
        console.warn(`Unknown event type: ${type}`);
        return Response.json({ ok: true });
    }

    if (Object.keys(updateData).length > 0) {
      await base44.asServiceRole.entities.EmailLog.update(log.id, updateData);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Resend webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});