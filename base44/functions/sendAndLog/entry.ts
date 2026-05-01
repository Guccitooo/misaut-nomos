import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
      html = null,
      category = 'transactional',
      user_id = null,
      campaign_id = null
    } = await req.json();

    const toArray = Array.isArray(to) ? to : [to];
    const results = [];

    for (const toEmail of toArray) {
      // Crear EmailLog UNA SOLA VEZ con status="queued"
      let emailLog = null;
      try {
        emailLog = await base44.asServiceRole.entities.EmailLog.create({
          to_email: toEmail,
          user_id: user_id || user.id,
          subject,
          template: template || 'raw_html',
          category,
          campaign_id: campaign_id || null,
          status: 'queued',
          metadata: { campaign_id }
        });
      } catch (e) {
        console.error(`[sendAndLog] Error creando EmailLog para ${toEmail}:`, e);
        results.push({ email: toEmail, status: 'error', error: e.message });
        continue;
      }

      try {
        // Comprobar unsubscribe si es marketing
        if (category === 'marketing') {
          const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
            email: toEmail,
            status: 'unsubscribed'
          });

          if (subscribers && subscribers.length > 0) {
            await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
              status: 'skipped',
              metadata: { reason: 'unsubscribed', campaign_id }
            });
            results.push({ email: toEmail, status: 'skipped' });
            continue;
          }
        }

        // Preparar vars para sendEmail
        const sendVars = (template === 'raw_html' && html)
          ? { ...vars, __html: html }
          : vars;

        // Invocar sendEmail (que tiene la blocklist, FROM override, etc.)
        const sendRes = await base44.functions.invoke('sendEmail', {
          to: toEmail,
          subject,
          template,
          vars: sendVars,
          category,
          campaign_id: campaign_id || null,
          metadata: { logId: emailLog.id, campaign_id }
        });

        const emailResult = sendRes?.results?.[0] || sendRes?.data?.results?.[0];

        if (emailResult?.status === 'skipped' || emailResult?.reason === 'blocklist') {
          // Bloqueado por blocklist o unsubscribed dentro de sendEmail
          await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
            status: 'skipped',
            metadata: { reason: emailResult.reason || 'skipped_by_sendemail', campaign_id }
          });
          results.push({ email: toEmail, status: 'skipped' });
          continue;
        }

        if (emailResult?.status === 'sent' && emailResult?.messageId) {
          // UPDATE el EmailLog existente (no crear nuevo)
          await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
            resend_message_id: emailResult.messageId,
            sent_at: new Date().toISOString(),
            status: 'sent',
            campaign_id: campaign_id || null
          });

          // Incrementar emails_sent en NewsletterSubscriber
          const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
            email: toEmail
          });
          if (subscribers && subscribers.length > 0) {
            const sub = subscribers[0];
            await base44.asServiceRole.entities.NewsletterSubscriber.update(sub.id, {
              emails_sent: (sub.emails_sent || 0) + 1,
              last_email_sent: new Date().toISOString()
            });
          }

          results.push({
            email: toEmail,
            status: 'sent',
            messageId: emailResult.messageId,
            logId: emailLog.id
          });
        } else if (emailResult?.status === 'failed') {
          await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
            status: 'failed',
            error_message: emailResult.error
          });
          results.push({ email: toEmail, status: 'failed', error: emailResult.error, logId: emailLog.id });
        } else {
          // Respuesta inesperada
          await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
            status: 'failed',
            error_message: 'Unexpected response from sendEmail'
          });
          results.push({ email: toEmail, status: 'failed', error: 'Unexpected response', logId: emailLog.id });
        }
      } catch (error) {
        console.error(`[sendAndLog] Error enviando a ${toEmail}:`, error);
        if (emailLog) {
          await base44.asServiceRole.entities.EmailLog.update(emailLog.id, {
            status: 'failed',
            error_message: error.message
          });
        }
        results.push({ email: toEmail, status: 'error', error: error.message });
      }
    }

    return Response.json({ results });
  } catch (error) {
    console.error('[sendAndLog] handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});