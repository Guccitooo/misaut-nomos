import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const BASE_URL = 'https://misautonomos.es';

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function formatMonthYear(my) {
  if (!my) return '';
  const [year, month] = my.split('-');
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}

function baseTemplate(content, preheader = '') {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
${preheader ? `<div style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
<style>
  body{margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
  .wrapper{width:100%;max-width:640px;margin:0 auto;padding:24px 16px;}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
  .header{background:linear-gradient(135deg,#2563EB 0%,#1e40af 100%);padding:32px 40px;text-align:center;}
  .header img{width:48px;height:48px;border-radius:10px;margin-bottom:12px;}
  .header h1{color:#fff;font-size:22px;font-weight:700;margin:0;line-height:1.3;}
  .header p{color:#93c5fd;font-size:14px;margin:6px 0 0;}
  .body{padding:32px 40px;}
  .body h2{color:#1e293b;font-size:18px;font-weight:700;margin:0 0 12px;}
  .body p{color:#475569;font-size:15px;line-height:1.65;margin:0 0 16px;}
  .cta{display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;margin:8px 0;}
  .cta:hover{background:#1d4ed8;}
  .metric-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:8px 0;}
  .metric-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f1f5f9;}
  .metric-row:last-child{border-bottom:none;}
  .metric-label{color:#64748b;font-size:13px;}
  .metric-value{color:#1e293b;font-weight:700;font-size:14px;}
  .badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;}
  .badge-blue{background:#dbeafe;color:#1d4ed8;}
  .badge-green{background:#dcfce7;color:#166534;}
  .divider{height:1px;background:#f1f5f9;margin:20px 0;}
  .creative-grid{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}
  .creative-img{width:100px;height:100px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;}
  .footer{padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;}
  .footer p{color:#94a3b8;font-size:12px;margin:4px 0;line-height:1.5;}
  .footer a{color:#64748b;text-decoration:underline;}
  @media(max-width:480px){
    .wrapper{padding:12px 8px;}
    .header,.body,.footer{padding:24px 20px;}
    .creative-img{width:80px;height:80px;}
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png" alt="MisAutónomos" />
      <h1>MisAutónomos</h1>
      <p>Plan Ads+ — Gestión de campañas</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>MisAutónomos · Tu plataforma de autónomos en España</p>
      <p><a href="${BASE_URL}">misautonomos.es</a></p>
    </div>
  </div>
</div>
</body>
</html>`;
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MisAutónomos <hola@misautonomos.es>',
      reply_to: 'hola@misautonomos.es',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

const EMAIL_BUILDERS = {

  briefing_received: (data) => {
    const monthLabel = formatMonthYear(data.monthYear);
    const subject = `✅ Recibimos tu briefing de ${monthLabel}`;
    const content = `
      <h2>¡Briefing recibido, ${data.professionalName}! 🎉</h2>
      <p>Hemos recibido correctamente tu briefing para la campaña de <strong>${monthLabel}</strong>. Nuestro equipo ya está trabajando en ello.</p>
      <div class="metric-box">
        <div class="metric-row"><span class="metric-label">Plataforma</span><span class="metric-value">${data.platform || '—'}</span></div>
        <div class="metric-row"><span class="metric-label">Objetivo</span><span class="metric-value">${data.goal || '—'}</span></div>
        <div class="metric-row"><span class="metric-label">Zona de servicio</span><span class="metric-value">${data.serviceArea || '—'}</span></div>
      </div>
      <p>Nuestro equipo revisará tu briefing y te enviará el material propuesto (copy + creatividades) en <strong>máximo 48 horas</strong>.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${BASE_URL}/mi-campana" class="cta">Ver estado de mi campaña →</a>
      </div>
      <div class="divider"></div>
      <p style="font-size:13px;color:#94a3b8;">Si tienes alguna duda, puedes usar el chat de campaña en tu panel de Ads+.</p>
    `;
    return { subject, html: baseTemplate(content, `Briefing de ${monthLabel} recibido`) };
  },

  admin_needs_info: (data) => {
    const monthLabel = formatMonthYear(data.monthYear);
    const subject = `📝 El equipo MisAutónomos te ha enviado un mensaje`;
    const content = `
      <h2>Tienes un nuevo mensaje, ${data.professionalName} 💬</h2>
      <p><strong>${data.adminName || 'El equipo MisAutónomos'}</strong> te ha escrito sobre tu campaña de <strong>${monthLabel}</strong>:</p>
      <div class="metric-box" style="border-left:3px solid #2563EB;padding-left:20px;">
        <p style="font-style:italic;color:#334155;font-size:15px;margin:0;">"${data.messagePreview || ''}"</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${BASE_URL}/mi-campana" class="cta">Responder ahora →</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">Puedes ver el hilo completo y responder desde tu panel de Ads+ en MisAutónomos.</p>
    `;
    return { subject, html: baseTemplate(content, `Nuevo mensaje del equipo sobre tu campaña`) };
  },

  material_ready_for_approval: (data) => {
    const monthLabel = formatMonthYear(data.monthYear);
    const subject = `🎨 Tu material de campaña está listo, ¡revísalo!`;
    const creativesHtml = (data.creativeUrls || []).slice(0, 6).map(url =>
      `<img src="${url}" class="creative-img" alt="Creativo" />`
    ).join('');
    const content = `
      <h2>Tu material de campaña está listo 🚀</h2>
      <p>Hola ${data.professionalName}, hemos preparado el material de tu campaña de <strong>${monthLabel}</strong>. ¡Échale un vistazo y danos tu aprobación para lanzarla!</p>
      ${data.adsCopy ? `
        <div class="divider"></div>
        <p style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Texto del anuncio</p>
        <div class="metric-box" style="border-left:3px solid #2563EB;">
          <p style="margin:0;color:#1e293b;font-size:14px;white-space:pre-line;">${data.adsCopy.substring(0, 400)}${data.adsCopy.length > 400 ? '...' : ''}</p>
        </div>
      ` : ''}
      ${creativesHtml ? `
        <div class="divider"></div>
        <p style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Creatividades</p>
        <div class="creative-grid">${creativesHtml}</div>
      ` : ''}
      <div class="divider"></div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${BASE_URL}/mi-campana" class="cta">✅ Revisar y aprobar →</a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">Si quieres pedir cambios, puedes hacerlo directamente desde el chat de tu panel de Ads+.</p>
    `;
    return { subject, html: baseTemplate(content, `Material de tu campaña de ${monthLabel} listo para aprobar`) };
  },

  campaign_live: (data) => {
    const monthLabel = formatMonthYear(data.monthYear);
    const subject = `🚀 Tu campaña de ${monthLabel} ya está en marcha`;
    const content = `
      <h2>¡Tu campaña está en vivo! 🎉</h2>
      <p>Hola ${data.professionalName}, tu campaña de <strong>${monthLabel}</strong> acaba de lanzarse. Ya está consiguiendo resultados.</p>
      <div class="metric-box">
        <div class="metric-row"><span class="metric-label">Plataforma</span><span class="metric-value">${data.platform || '—'}</span></div>
        <div class="metric-row"><span class="metric-label">Presupuesto</span><span class="metric-value">${data.budget || '30'}€</span></div>
        <div class="metric-row"><span class="metric-label">Objetivo</span><span class="metric-value">${data.goal || '—'}</span></div>
      </div>
      <p>En tu panel de Ads+ podrás ver las métricas en tiempo real: alcance, clics, leads generados y más.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${BASE_URL}/mi-campana" class="cta">Ver métricas en tiempo real →</a>
      </div>
    `;
    return { subject, html: baseTemplate(content, `¡Tu campaña de ${monthLabel} está en vivo!`) };
  },

  monthly_report: (data) => {
    const monthLabel = formatMonthYear(data.monthYear);
    const subject = `📊 Resumen de tu campaña de ${monthLabel}`;
    const m = data.metrics || {};
    const content = `
      <h2>Resumen de tu campaña de ${monthLabel} 📊</h2>
      <p>Hola ${data.professionalName}, aquí tienes los resultados finales de tu campaña.</p>
      <div class="metric-box">
        <div class="metric-row"><span class="metric-label">Alcance total</span><span class="metric-value">${(m.reach || 0).toLocaleString('es-ES')}</span></div>
        <div class="metric-row"><span class="metric-label">Impresiones</span><span class="metric-value">${(m.impressions || 0).toLocaleString('es-ES')}</span></div>
        <div class="metric-row"><span class="metric-label">Clics</span><span class="metric-value">${(m.clicks || 0).toLocaleString('es-ES')}</span></div>
        <div class="metric-row"><span class="metric-label">Leads generados</span><span class="metric-value badge badge-green">${m.leads_generated || 0}</span></div>
        <div class="metric-row"><span class="metric-label">Presupuesto invertido</span><span class="metric-value">${(m.spent_eur || 0).toFixed(2)}€</span></div>
        <div class="metric-row"><span class="metric-label">CPC medio</span><span class="metric-value">${(m.cpc || 0).toFixed(2)}€</span></div>
      </div>
      <div class="divider"></div>
      <p><strong>¿Qué viene ahora?</strong> El próximo mes puedes volver a configurar tu campaña desde tu panel. Si quieres repetir la misma estrategia, puedes editar solo los aspectos que quieras cambiar.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${BASE_URL}/mi-campana/briefing" class="cta">Configurar campaña del próximo mes →</a>
      </div>
    `;
    return { subject, html: baseTemplate(content, `Resultados de tu campaña de ${monthLabel}`) };
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, data } = await req.json();

    if (!type || !data) {
      return Response.json({ error: 'Missing type or data' }, { status: 400 });
    }

    const builder = EMAIL_BUILDERS[type];
    if (!builder) {
      return Response.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    const { subject, html } = builder(data);

    if (!data.professionalEmail) {
      return Response.json({ error: 'Missing professionalEmail' }, { status: 400 });
    }

    const result = await sendEmail(data.professionalEmail, subject, html);
    return Response.json({ success: true, id: result.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});