import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, giftedPlanName, giftedUntil, originalPlanName, duration, giftedPlanId } = await req.json();

    // Buscar usuario con service role
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    const targetUser = users?.[0];
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdsPlan = giftedPlanId === 'plan_adsplus';
    const expiryDate = new Date(giftedUntil).toLocaleDateString('es-ES');

    // Email via Core integration
    try {
      await base44.integrations.Core.SendEmail({
        to: targetUser.email,
        subject: `🎁 Te hemos regalado ${giftedPlanName} - MisAutónomos`,
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">¡Hola ${targetUser.full_name || ''}! 🎁</h2>
  <p>El equipo de <strong>MisAutónomos</strong> te ha regalado acceso al <strong>${giftedPlanName}</strong> durante <strong>${duration} días</strong>.</p>
  <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 8px;">
    <p style="margin: 0;"><strong>Plan regalado:</strong> ${giftedPlanName}</p>
    <p style="margin: 8px 0 0;"><strong>Válido hasta:</strong> ${expiryDate}</p>
    <p style="margin: 8px 0 0;"><strong>Plan original:</strong> ${originalPlanName} (continúa al expirar el regalo)</p>
  </div>
  ${isAdsPlan ? `<p>🚀 Para activar tus campañas publicitarias, <a href="https://misautonomos.es/mi-campana" style="color: #2563eb;">completa tu briefing mensual</a>.</p>` : `<p>✨ Disfruta de todos los beneficios de ${giftedPlanName} en tu <a href="https://misautonomos.es/dashboard" style="color: #2563eb;">panel de control</a>.</p>`}
  <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">El equipo de MisAutónomos</p>
</div>
        `
      });
      console.log(`[sendGiftNotification] ✅ Email enviado a ${targetUser.email}`);
    } catch (e) {
      console.error('[sendGiftNotification] ❌ Error enviando email:', e.message);
    }

    // Notificación interna en la app
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: userId,
        type: 'system_update',
        title: `🎁 ¡Has recibido un regalo!`,
        message: `Te hemos regalado ${giftedPlanName} durante ${duration} días (hasta el ${expiryDate}).`,
        link: isAdsPlan ? '/mi-campana' : '/suscripcion',
        is_read: false,
        priority: 'high'
      });
      console.log(`[sendGiftNotification] ✅ Notificación interna creada para user ${userId}`);
    } catch (e) {
      console.error('[sendGiftNotification] ❌ Error creando notificación:', e.message);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[sendGiftNotification] ❌ Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});