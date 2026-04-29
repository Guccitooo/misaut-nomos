import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Templates HTML inline
const templates = {
  welcome: ({ name, ctaUrl }) => `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb">
<div style="max-width:600px;margin:0 auto;background:#fff">
<div style="background:#fff;padding:30px;text-align:center;border-bottom:1px solid #e5e7eb"><h1 style="margin:0;font-size:24px;font-weight:bold;color:#1f2937">MisAutónomos</h1></div>
<div style="padding:40px 30px"><h2 style="font-size:20px;font-weight:bold;color:#1f2937;margin-bottom:20px">¡Bienvenido, ${name}!</h2><p style="font-size:16px;line-height:1.6;color:#4b5563;margin:15px 0">Gracias por registrarte en MisAutónomos. Estamos emocionados de tenerte con nosotros.</p><p style="font-size:16px;line-height:1.6;color:#4b5563;margin:15px 0">Explora la plataforma y comienza a conectar con profesionales de calidad.</p><div style="text-align:center;margin-top:30px"><a href="${ctaUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">Empieza ahora</a></div></div>
<div style="padding:20px 30px;background:#f3f4f6;font-size:12px;color:#6b7280;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:10px 0">MisAutónomos | Barcelona, España</p></div>
</div></body></html>`,

  gift_received: ({ name, planName, until, profileUrl }) => `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb">
<div style="max-width:600px;margin:0 auto;background:#fff">
<div style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);padding:30px;text-align:center"><h1 style="margin:0;font-size:24px;font-weight:bold;color:#fff">🎉 ¡Plan ${planName} Gratis!</h1></div>
<div style="padding:40px 30px"><p style="display:inline-block;background:#ecfdf5;color:#047857;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:20px">Plan Premium hasta ${until}</p><h2 style="font-size:20px;font-weight:bold;color:#1f2937;margin-bottom:20px">¡Felicidades, ${name}!</h2><p style="font-size:16px;line-height:1.6;color:#4b5563;margin:15px 0">Has recibido acceso gratuito a nuestro Plan ${planName} Premium.</p><div style="text-align:center;margin-top:30px"><a href="${profileUrl}" style="display:inline-block;background:#10b981;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">Ver mi Plan ${planName}</a></div></div>
<div style="padding:20px 30px;background:#f3f4f6;font-size:12px;color:#6b7280;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:10px 0">MisAutónomos | Barcelona, España</p></div>
</div></body></html>`,

  review_request: ({ clientName, professionalName, reviewUrl }) => `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb">
<div style="max-width:600px;margin:0 auto;background:#fff">
<div style="background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%);padding:30px;text-align:center"><h1 style="margin:0;font-size:24px;font-weight:bold;color:#fff">⭐ Tu opinión importa</h1></div>
<div style="padding:40px 30px"><h2 style="font-size:20px;font-weight:bold;color:#1f2937;margin-bottom:20px">Hola ${clientName},</h2><p style="font-size:16px;line-height:1.6;color:#4b5563;margin:15px 0">Contactaste recientemente con <strong>${professionalName}</strong> a través de MisAutónomos.</p><p style="font-size:16px;line-height:1.6;color:#4b5563;margin:15px 0">Tu opinión ayuda a otros clientes a encontrar los mejores profesionales. ¡Solo 2 minutos! ⏱️</p><div style="text-align:center;margin-top:30px"><a href="${reviewUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">Dejar opinión</a></div></div>
<div style="padding:20px 30px;background:#f3f4f6;font-size:12px;color:#6b7280;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:10px 0">MisAutónomos | Barcelona, España</p></div>
</div></body></html>`,

  generic: ({ headline, body, ctaText, ctaUrl }) => `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb">
<div style="max-width:600px;margin:0 auto;background:#fff">
<div style="background:#fff;padding:30px;text-align:center;border-bottom:1px solid #e5e7eb"><h1 style="margin:0;font-size:24px;font-weight:bold;color:#1f2937">MisAutónomos</h1></div>
<div style="padding:40px 30px"><h2 style="font-size:20px;font-weight:bold;color:#1f2937;margin-bottom:20px">${headline}</h2><div style="font-size:16px;line-height:1.6;color:#4b5563;margin:15px 0">${body}</div>${ctaUrl && ctaText ? `<div style="text-align:center;margin-top:30px"><a href="${ctaUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">${ctaText}</a></div>` : ''}</div>
<div style="padding:20px 30px;background:#f3f4f6;font-size:12px;color:#6b7280;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:10px 0">MisAutónomos | Barcelona, España</p></div>
</div></body></html>`
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      to,
      subject,
      template,
      vars = {},
      category = 'transactional',
      user_id = null,
      campaign_id = null
    } = await req.json();

    const toArray = Array.isArray(to) ? to : [to];
    const results = [];

    for (const toEmail of toArray) {
      try {
        // 1. Comprobar unsubscribe si es marketing
        if (category === 'marketing') {
          const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
            email: toEmail,
            status: 'unsubscribed'
          });

          if (subscribers && subscribers.length > 0) {
            await base44.asServiceRole.entities.EmailLog.create({
              to_email: toEmail,
              user_id: user_id || user.id,
              subject,
              template,
              category,
              status: 'skipped',
              metadata: { reason: 'unsubscribed', campaign_id }
            });
            results.push({ email: toEmail, status: 'skipped' });
            continue;
          }
        }

        // 2. Crear EmailLog inicial
        const emailLog = await base44.asServiceRole.entities.EmailLog.create({
          to_email: toEmail,
          user_id: user_id || user.id,
          subject,
          template,
          category,
          status: 'queued',
          metadata: { campaign_id }
        });

        // 3. Llamar a sendEmail existente
        const sendRes = await base44.functions.invoke('sendEmail', {
          to: toEmail,
          subject,
          template,
          vars,
          category,
          metadata: { logId: emailLog.id, campaign_id }
        });

        // 4. Actualizar EmailLog con resultado
        if (sendRes && sendRes.results && sendRes.results.length > 0) {
          const emailResult = sendRes.results[0];
          
          if (emailResult.status === 'sent' && emailResult.messageId) {
            await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
              resend_message_id: emailResult.messageId,
              sent_at: new Date().toISOString(),
              status: 'sent'
            });

            // 5. Incrementar emails_sent en NewsletterSubscriber
            const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
              email: toEmail
            });

            if (subscribers && subscribers.length > 0) {
              const subscriber = subscribers[0];
              const newCount = (subscriber.emails_sent || 0) + 1;
              await base44.asServiceRole.entities.NewsletterSubscriber.update(subscriber.id, {
                emails_sent: newCount,
                last_email_sent: new Date().toISOString()
              });
            }

            results.push({
              email: toEmail,
              status: 'sent',
              messageId: emailResult.messageId,
              logId: emailLog.id
            });
          } else if (emailResult.status === 'failed') {
            await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
              status: 'failed',
              error_message: emailResult.error
            });

            results.push({
              email: toEmail,
              status: 'failed',
              error: emailResult.error,
              logId: emailLog.id
            });
          }
        }
      } catch (error) {
        console.error(`sendAndLog error for ${toEmail}:`, error);
        results.push({
          email: toEmail,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({ results });
  } catch (error) {
    console.error('sendAndLog handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});