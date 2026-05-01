import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Mapear estado de Resend API → nuestro status + campos
function mapResendStatus(resendEmail) {
  // La API de Resend devuelve last_event con el último estado
  const lastEvent = resendEmail.last_event;

  const map = {
    delivered: { status: 'delivered', delivered_at: resendEmail.created_at },
    opened: { status: 'opened', opened_at: resendEmail.created_at },
    clicked: { status: 'clicked', clicked_at: resendEmail.created_at },
    bounced: { status: 'bounced', bounced_at: resendEmail.created_at, error_message: 'Bounce (backfill)' },
    complained: { status: 'spam', complained_at: resendEmail.created_at },
    sent: { status: 'sent' },
  };

  return map[lastEvent] || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obtener todos los EmailLog con status=sent y resend_message_id
    let allLogs = [];
    let skip = 0;
    const batchSize = 500;

    while (true) {
      const batch = await base44.asServiceRole.entities.EmailLog.filter(
        { status: 'sent' },
        '-created_date',
        batchSize,
        skip
      );
      if (!batch || batch.length === 0) break;
      allLogs = allLogs.concat(batch.filter(l => l.resend_message_id));
      if (batch.length < batchSize) break;
      skip += batchSize;
    }

    console.log(`[backfill] Procesando ${allLogs.length} EmailLog con status=sent`);

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < allLogs.length; i++) {
      const log = allLogs[i];

      try {
        // Rate limit: max 5 req/s → esperar 200ms entre cada uno
        if (i > 0) await sleep(200);

        const res = await fetch(`https://api.resend.com/emails/${log.resend_message_id}`, {
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
        });

        if (!res.ok) {
          console.warn(`[backfill] Resend API error para ${log.resend_message_id}: ${res.status}`);
          failed++;
          continue;
        }

        const resendEmail = await res.json();
        const update = mapResendStatus(resendEmail);

        if (update) {
          await base44.asServiceRole.entities.EmailLog.update(log.id, update);
          updated++;
        } else {
          skipped++;
        }
      } catch (e) {
        console.error(`[backfill] Error para log ${log.id}:`, e.message);
        failed++;
      }
    }

    return Response.json({
      total: allLogs.length,
      updated,
      skipped,
      failed
    });
  } catch (error) {
    console.error('[backfill] Error general:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});