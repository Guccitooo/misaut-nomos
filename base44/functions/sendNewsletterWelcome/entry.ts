Deno.serve(async (req) => {
  try {
    const { email, language, unsubToken } = await req.json();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const isEN = language === 'en';
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${isEN ? 'Welcome!' : '¡Bienvenido!'}</title></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #E2E8F0;background:#0F172A;">
          <span style="color:#F8FAFC;font-weight:700;font-size:18px;">MisAutónomos</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;">${isEN ? '🎉 Welcome to our newsletter!' : '🎉 ¡Bienvenido a nuestra newsletter!'}</h1>
          <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 12px;">
            ${isEN
              ? "Thanks for subscribing. You'll receive practical tips, fiscal guides and useful tools for self-employed professionals and clients in Spain."
              : 'Gracias por suscribirte. Recibirás consejos prácticos, guías fiscales y herramientas útiles para autónomos y clientes en España.'}
          </p>
          <p style="font-size:14px;color:#475569;margin:0 0 8px;">${isEN ? 'What to expect:' : 'Qué puedes esperar:'}</p>
          <ul style="font-size:14px;color:#334155;line-height:1.9;margin:0 0 24px;padding-left:20px;">
            <li>${isEN ? '1–2 emails per month (we respect your inbox)' : '1-2 emails al mes (respetamos tu bandeja)'}</li>
            <li>${isEN ? 'Practical articles and guides' : 'Artículos prácticos y guías'}</li>
            <li>${isEN ? 'Product news and updates' : 'Novedades y actualizaciones del producto'}</li>
            <li>${isEN ? 'No spam, no reselling your data' : 'Sin spam ni reventa de tus datos'}</li>
          </ul>
          <a href="https://misautonomos.es/blog" style="display:inline-block;background:#0F172A;color:#FFFFFF;font-weight:600;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:10px;">
            ${isEN ? 'Read the blog' : 'Leer el blog'}
          </a>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #E2E8F0;background:#F8FAFC;">
          <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.6;">
            ${isEN
              ? `You're receiving this because you subscribed at <a href="https://misautonomos.es" style="color:#3B82F6;text-decoration:none;">misautonomos.es</a>.`
              : `Recibes este email porque te suscribiste en <a href="https://misautonomos.es" style="color:#3B82F6;text-decoration:none;">misautonomos.es</a>.`}
            <br>
            <a href="https://misautonomos.es/newsletter/unsubscribe?token=${unsubToken}" style="color:#94A3B8;">${isEN ? 'Unsubscribe' : 'Darme de baja'}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MisAutónomos <hola@misautonomos.es>',
        reply_to: 'hola@misautonomos.es',
        to: [email],
        subject: isEN ? '🎉 Welcome to MisAutónomos newsletter' : '🎉 Bienvenido a la newsletter de MisAutónomos',
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend error:', JSON.stringify(data));
      return Response.json({ error: data.message || 'Email send failed' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendNewsletterWelcome error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});