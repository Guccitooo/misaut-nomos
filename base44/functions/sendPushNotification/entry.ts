// CONFIGURACIÓN REQUERIDA:
// 1. Ir a https://dashboard.onesignal.com > Settings > Keys & IDs
// 2. Copiar el valor de "REST API Key"
// 3. En Base44: añadir variable de entorno ONESIGNAL_REST_API_KEY con ese valor
// 4. App ID ya configurado: e178adb2-38e8-4397-9239-833be611ed27

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ONESIGNAL_APP_ID = 'e178adb2-38e8-4397-9239-833be611ed27';
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userIds, title, message, url, data = {} } = await req.json();

    const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    if (!apiKey) {
      console.error('ONESIGNAL_REST_API_KEY no configurada');
      return Response.json({ success: false, error: 'missing_api_key' });
    }

    if (!userIds || userIds.length === 0) {
      return Response.json({ success: false, error: 'no_recipients' });
    }

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: userIds },
      target_channel: 'push',
      headings: { en: title, es: title },
      contents: { en: message, es: message },
      url: url || 'https://misautonomos.es',
      data,
      chrome_web_icon: 'https://misautonomos.es/logo-192.png',
    };

    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal error:', JSON.stringify(result));
      return Response.json({ success: false, error: result });
    }

    console.log(`Push enviado: ${result.id} → ${result.recipients} destinatarios`);
    return Response.json({ success: true, notificationId: result.id, recipients: result.recipients });
  } catch (error) {
    console.error('Error enviando push:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});