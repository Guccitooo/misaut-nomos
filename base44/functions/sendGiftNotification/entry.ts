import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, giftedPlanName, giftedUntil, originalPlanName, duration, giftedPlanId } = await req.json();
    const { User } = await import('@/api/entities');
    
    const targetUser = await User.get(userId);
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const lang = targetUser.language || 'es';
    const isAdsPlan = giftedPlanId === 'plan_adsplus';
    
    // Push notification
    try {
      const { sendPush } = await import('@/services/pushNotifications');
      await sendPush({
        userIds: [userId],
        title: lang === 'en' ? '🎁 You received a gift!' : '🎁 ¡Has recibido un regalo!',
        message: lang === 'en' 
          ? `We've gifted you ${giftedPlanName} for ${duration} days. ${isAdsPlan ? 'Complete your questionnaire to activate campaigns.' : 'Enjoy!'}`
          : `Te regalamos ${giftedPlanName} durante ${duration} días. ${isAdsPlan ? 'Completa el cuestionario para activar campañas.' : '¡Disfrútalo!'}`,
        url: isAdsPlan ? 'https://misautonomos.es/mi-campana' : 'https://misautonomos.es/suscripcion'
      });
    } catch (e) {
      console.error('Error sending push:', e);
    }
    
    // Email
    try {
      const { giftReceivedEmail } = await import('@/services/emails');
      const { sendEmail } = await import('@/api/integrations');
      
      await sendEmail({
        to: targetUser.email,
        subject: lang === 'en' 
          ? `🎁 We've gifted you ${giftedPlanName}` 
          : `🎁 Te hemos regalado ${giftedPlanName}`,
        html: giftReceivedEmail({
          userName: targetUser.full_name,
          giftedPlanName,
          giftedUntil,
          originalPlanName,
          duration,
          giftedPlanId
        }, lang)
      });
    } catch (e) {
      console.error('Error sending email:', e);
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in sendGiftNotification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});