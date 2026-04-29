import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { subscriptionId, giftedPlanId, giftedPlanName, giftedUntil, giftReason } = await req.json();

    if (!subscriptionId || !giftedPlanId || !giftedUntil) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Leer la suscripción actual para el audit log
    const sub = await base44.asServiceRole.entities.Subscription.get(subscriptionId);

    // Calcular fecha_expiracion: max(actual, gifted_until)
    const giftedUntilDate = new Date(giftedUntil);
    const currentExpiration = sub.fecha_expiracion ? new Date(sub.fecha_expiracion) : new Date(0);
    const newExpiration = giftedUntilDate > currentExpiration ? giftedUntilDate : currentExpiration;

    // Actualizar suscripción con el regalo + asegurar estado activo y fecha_expiracion extendida
    await base44.asServiceRole.entities.Subscription.update(subscriptionId, {
      gifted_plan_id: giftedPlanId,
      gifted_plan_name: giftedPlanName,
      gifted_until: giftedUntil,
      gifted_by_admin_id: user.id,
      gifted_at: new Date().toISOString(),
      gift_reason: giftReason || '',
      estado: 'activo',
      fecha_expiracion: newExpiration.toISOString(),
    });

    // Guardar en el registro de auditoría
    try {
      // Obtener email del usuario afectado
      const targetUsers = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
      const targetUser = targetUsers?.[0];

      await base44.asServiceRole.entities.PlanAuditLog.create({
        user_id: sub.user_id,
        user_email: targetUser?.email || sub.user_id,
        changed_by_id: user.id,
        changed_by_email: user.email,
        change_type: 'gift_upgrade',
        plan_before: sub.plan_id,
        plan_before_name: sub.plan_nombre,
        plan_after: giftedPlanId,
        plan_after_name: giftedPlanName,
        reason: giftReason || '',
        valid_until: giftedUntil,
        subscription_id: subscriptionId
      });
      console.log(`[giftUpgrade] ✅ Audit log guardado para user=${sub.user_id}`);
    } catch (e) {
      console.error('[giftUpgrade] ❌ Error guardando audit log:', e.message);
    }

    // Cargar usuario receptor y perfil profesional (necesarios para los 3 pasos siguientes)
    let targetUser = null;
    let proProfile = null;
    try {
      const targetUsers = await base44.asServiceRole.entities.User.filter({ id: sub.user_id });
      targetUser = targetUsers?.[0] || null;
      const proProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: sub.user_id });
      proProfile = proProfiles?.[0] || null;
    } catch (e) {
      console.warn('[giftUpgrade] ⚠️ Error cargando usuario/perfil:', e.message);
    }

    const recipientName = targetUser?.full_name || targetUser?.email || 'Usuario';
    const hasProfile = !!(proProfile && proProfile.onboarding_completed);
    const giftedAtDate = new Date();
    const giftedUntilDate2 = new Date(giftedUntil);
    const diffDays = Math.round((giftedUntilDate2 - giftedAtDate) / (1000 * 60 * 60 * 24));

    // 1. Crear Message en BD (chat interno desde soporte)
    try {
      const msgContent = hasProfile
        ? `¡Hola ${recipientName}! 👋 Te hemos regalado **${giftedPlanName} durante ${diffDays} días** como cortesía de MisAutónomos. 🎁 Tu perfil ya está activo y aparecerás destacado en los listados públicos.${giftReason ? ' ' + giftReason : ''}\n\n— Equipo MisAutónomos`
        : `¡Hola ${recipientName}! 👋 Te hemos regalado **${giftedPlanName} durante ${diffDays} días** como cortesía de MisAutónomos. 🎁 Para empezar a aprovecharlo, completa tu perfil aquí: https://misautonomos.es/Onboarding\n\n— Equipo MisAutónomos`;

      await base44.asServiceRole.entities.Message.create({
        sender_id: 'support_team',
        sender_name: 'Equipo MisAutónomos',
        recipient_id: sub.user_id,
        conversation_id: `support_${sub.user_id}`,
        content: msgContent,
        is_read: false,
      });
      console.log(`[giftUpgrade] ✅ Message de regalo creado para user=${sub.user_id}`);
    } catch (e) {
      console.error('[giftUpgrade] ❌ Error creando Message:', e.message);
    }

    // 2. Crear Notification mejorada
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: sub.user_id,
        type: 'welcome',
        title: `🎁 Has recibido ${giftedPlanName} gratis`,
        message: `Cortesía de MisAutónomos durante ${diffDays} días. Aparecerás destacado en los listados públicos.`,
        link: hasProfile ? '/MyProfile' : '/Onboarding',
        is_read: false,
        priority: 'high'
      });
      console.log(`[giftUpgrade] ✅ Notificación enviada a user=${sub.user_id}`);
    } catch (e) {
      console.error('[giftUpgrade] ❌ Error creando Notification:', e.message);
    }

    // 3. Auto-activar perfil si es Plan Ads+ y tiene onboarding completado
    if (giftedPlanId === 'plan_adsplus' && proProfile && proProfile.onboarding_completed) {
      try {
        await base44.asServiceRole.entities.ProfessionalProfile.update(proProfile.id, {
          estado_perfil: 'activo',
          visible_en_busqueda: true,
        });
        console.log(`[giftUpgrade] ✅ Perfil activado automáticamente para user=${sub.user_id}`);
      } catch (e) {
        console.error('[giftUpgrade] ❌ Error activando perfil:', e.message);
      }
    }

    // Sincronizar is_ads_plus en ProfessionalProfile
    try {
      await base44.asServiceRole.functions.invoke('syncAdsPlusStatus', { userId: sub.user_id });
      console.log(`[giftUpgrade] ✅ syncAdsPlusStatus ejecutado para user=${sub.user_id}`);
    } catch (e) {
      console.error('[giftUpgrade] ⚠️ syncAdsPlusStatus falló (no crítico):', e.message);
    }

    console.log(`[giftUpgrade] ✅ Regalo aplicado: sub=${subscriptionId}, plan=${giftedPlanId}, hasta=${giftedUntil}, admin=${user.email}, estado→activo, expiracion→${newExpiration.toISOString()}`);
    return Response.json({ ok: true });

  } catch (error) {
    console.error('[giftUpgrade] ❌ Error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});