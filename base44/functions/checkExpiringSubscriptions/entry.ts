// Función programada: ejecutar diariamente a las 10:00
// Notifica a profesionales cuya suscripción expira en 7, 3 o 1 día(s).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ONESIGNAL_APP_ID = 'e178adb2-38e8-4397-9239-833be611ed27';
const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

async function sendPush(userId, title, message, url) {
  const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
  if (!apiKey) return;
  await fetch(ONESIGNAL_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [userId] },
      target_channel: 'push',
      headings: { en: title, es: title },
      contents: { en: message, es: message },
      url,
    }),
  }).catch(e => console.error('Push error:', e));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const in8Days = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ estado: 'activo' });

    let notified = 0;
    for (const sub of subscriptions) {
      if (!sub.fecha_expiracion) continue;
      const expDate = new Date(sub.fecha_expiracion);
      if (expDate > in8Days || expDate < now) continue;

      const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
      if (![7, 3, 1].includes(daysLeft)) continue;

      const title = `⏰ Tu suscripción expira en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`;
      const message = 'Renueva para seguir recibiendo clientes';
      const url = 'https://misautonomos.es/suscripcion';

      // Notificación en BD
      await base44.asServiceRole.entities.Notification.create({
        user_id: sub.user_id,
        type: 'subscription_expiring',
        title,
        message,
        link: url,
        is_read: false,
        priority: 'high',
        metadata: { subscriptionId: sub.id, daysLeft },
      }).catch(e => console.error('Notification error:', e));

      // Push
      await sendPush(sub.user_id, title, message, url);
      notified++;
    }

    console.log(`checkExpiringSubscriptions: ${notified} notificaciones enviadas`);
    return Response.json({ success: true, notified, checked: subscriptions.length });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});