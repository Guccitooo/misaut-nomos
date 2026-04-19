/**
 * Plantillas de email para el sistema de regalos
 */

const renderEmail = ({ lang, preheader, title, alert, bodyHtml, cta }) => {
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          ${preheader ? `<tr><td style="background:#F0F9FF;padding:12px;text-align:center;font-size:13px;color:#0369A1;">${preheader}</td></tr>` : ''}
          <tr>
            <td style="padding:40px 32px;">
              <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111827;">${title}</h1>
              ${alert === 'success' ? '<div style="background:#ECFDF5;border:1px solid #10B981;border-radius:8px;padding:12px;margin-bottom:20px;text-align:center;font-size:14px;color:#065F46;">✓</div>' : ''}
              ${alert === 'warning' ? '<div style="background:#FFFBEB;border:1px solid #F59E0B;border-radius:8px;padding:12px;margin-bottom:20px;text-align:center;font-size:14px;color:#92400E;">⚠</div>' : ''}
              <div style="color:#374151;line-height:1.6;font-size:15px;">${bodyHtml}</div>
              ${cta ? `
                <div style="margin-top:32px;text-align:center;">
                  <a href="${cta.url}" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">${cta.label}</a>
                </div>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;padding:24px 32px;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;text-align:center;">
              <p style="margin:0 0 8px;">MisAutónomos</p>
              <p style="margin:0;font-size:12px;">© 2025 MisAutónomos. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const giftReceivedEmail = ({ userName, giftedPlanName, giftedUntil, originalPlanName, duration, giftedPlanId }, lang = 'es') => {
  const expiry = new Date(giftedUntil).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  
  // Bloque extra SOLO si el plan regalado incluye marketing/ads (plan_adsplus)
  const isAdsPlan = giftedPlanId === 'plan_adsplus';
  
  const actionBlockEs = isAdsPlan ? `
    <div style="background:#EFF6FF;border:1px solid #3B82F6;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:600;color:#1E40AF;font-size:15px;">📋 Importante: necesitamos unos datos tuyos</p>
      <p style="margin:8px 0 0;font-size:14px;color:#1E293B;line-height:1.5;">
        El plan <strong>${giftedPlanName}</strong> incluye gestión de campañas publicitarias personalizadas. 
        Para que podamos crear campañas efectivas para tu negocio, necesitamos conocerlo mejor.
      </p>
      <p style="margin:12px 0 0;font-size:14px;color:#1E293B;line-height:1.5;">
        Por favor, entra en tu cuenta y completa el <strong>cuestionario inicial</strong> (2 minutos):
      </p>
      <ul style="margin:8px 0 0;font-size:13px;color:#475569;line-height:1.7;">
        <li>Cómo es tu cliente ideal</li>
        <li>En qué redes suele estar presente</li>
        <li>Cómo consigues clientes actualmente</li>
        <li>Tu objetivo principal para los próximos meses</li>
      </ul>
      <p style="margin:12px 0 0;font-size:13px;color:#64748B;font-style:italic;">
        Sin esta información no podremos preparar tus campañas de ads.
      </p>
    </div>
  ` : '';
  
  const actionBlockEn = isAdsPlan ? `
    <div style="background:#EFF6FF;border:1px solid #3B82F6;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-weight:600;color:#1E40AF;font-size:15px;">📋 Important: we need some info from you</p>
      <p style="margin:8px 0 0;font-size:14px;color:#1E293B;line-height:1.5;">
        The <strong>${giftedPlanName}</strong> plan includes personalized ad campaign management. 
        To create effective campaigns for your business, we need to know it better.
      </p>
      <p style="margin:12px 0 0;font-size:14px;color:#1E293B;line-height:1.5;">
        Please log into your account and complete the <strong>initial questionnaire</strong> (2 minutes):
      </p>
      <ul style="margin:8px 0 0;font-size:13px;color:#475569;line-height:1.7;">
        <li>Who is your ideal client</li>
        <li>On which platforms they usually are</li>
        <li>How you currently get clients</li>
        <li>Your main goal for the coming months</li>
      </ul>
      <p style="margin:12px 0 0;font-size:13px;color:#64748B;font-style:italic;">
        Without this information we won't be able to prepare your ad campaigns.
      </p>
    </div>
  ` : '';
  
  return renderEmail({
    lang,
    preheader: lang === 'en' ? `You've received a premium plan gift` : `Has recibido un regalo: acceso premium`,
    title: lang === 'en' ? `🎁 We've gifted you ${giftedPlanName}!` : `🎁 ¡Te hemos regalado ${giftedPlanName}!`,
    alert: 'success',
    bodyHtml: lang === 'en'
      ? `<p>Hi <strong>${userName}</strong>,</p>
         <p>Great news! As a thank you, we've gifted you <strong>${giftedPlanName}</strong> for <strong>${duration} days</strong>.</p>
         
         <div style="background:#FFFBEB;border:1px solid #F59E0B;border-radius:10px;padding:16px;margin:16px 0;">
           <p style="margin:0;font-size:13px;color:#92400E;">Active until:</p>
           <p style="margin:4px 0 0;font-weight:600;color:#78350F;font-size:16px;">${expiry}</p>
         </div>
         
         ${actionBlockEn}
         
         <p><strong>What does this mean?</strong></p>
         <ul style="font-size:14px;color:#1E293B;">
           <li>All ${giftedPlanName} features are unlocked</li>
           <li>Your current billing won't change — you continue paying only for ${originalPlanName}</li>
           <li>After ${duration} days, your account returns to ${originalPlanName}</li>
         </ul>`
      : `<p>Hola <strong>${userName}</strong>,</p>
         <p>¡Buenas noticias! Como agradecimiento, te hemos regalado <strong>${giftedPlanName}</strong> durante <strong>${duration} días</strong>.</p>
         
         <div style="background:#FFFBEB;border:1px solid #F59E0B;border-radius:10px;padding:16px;margin:16px 0;">
           <p style="margin:0;font-size:13px;color:#92400E;">Activo hasta:</p>
           <p style="margin:4px 0 0;font-weight:600;color:#78350F;font-size:16px;">${expiry}</p>
         </div>
         
         ${actionBlockEs}
         
         <p><strong>¿Qué significa esto?</strong></p>
         <ul style="font-size:14px;color:#1E293B;">
           <li>Tienes desbloqueadas todas las funciones de ${giftedPlanName}</li>
           <li>Tu facturación NO cambia — sigues pagando solo tu ${originalPlanName}</li>
           <li>Al pasar los ${duration} días, tu cuenta vuelve a ${originalPlanName}</li>
         </ul>`,
    cta: {
      label: isAdsPlan 
        ? (lang === 'en' ? 'Complete the questionnaire now' : 'Completar cuestionario ahora')
        : (lang === 'en' ? 'Open my account' : 'Abrir mi cuenta'),
      url: isAdsPlan 
        ? 'https://misautonomos.es/mi-campana' 
        : 'https://misautonomos.es/suscripcion'
    }
  });
};

export const giftExpiredEmail = (user, giftedPlanName, originalPlanName, lang = 'es') => {
  return renderEmail({
    lang,
    title: lang === 'en' ? `Your gift has ended` : `Tu regalo ha finalizado`,
    alert: 'warning',
    bodyHtml: lang === 'en'
      ? `<p>Hi <strong>${user.full_name}</strong>,</p>
         <p>Your free access to <strong>${giftedPlanName}</strong> has ended. Your account is now back to <strong>${originalPlanName}</strong>.</p>
         <p>Hope you enjoyed it! If you'd like to keep ${giftedPlanName}, you can upgrade anytime.</p>`
      : `<p>Hola <strong>${user.full_name}</strong>,</p>
         <p>Tu acceso gratuito a <strong>${giftedPlanName}</strong> ha finalizado. Tu cuenta ha vuelto a <strong>${originalPlanName}</strong>.</p>
         <p>Esperamos que lo hayas disfrutado. Si quieres mantener ${giftedPlanName}, puedes cambiar de plan cuando quieras.</p>`,
    cta: {
      label: lang === 'en' ? 'See plans' : 'Ver planes',
      url: 'https://misautonomos.es/precios'
    }
  });
};

export { renderEmail };