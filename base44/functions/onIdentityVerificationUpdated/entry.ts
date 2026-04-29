import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Automation: entity trigger on IdentityVerification update.
 * Cuando status → "approved":
 *   1. Actualiza ProfessionalProfile.identity_verified = true
 *   2. Crea Notification para el pro
 *   3. Envía Message desde support_team
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    if (event?.type !== 'update') return Response.json({ ok: true, skipped: 'not_update' });
    if (data?.status !== 'approved') return Response.json({ ok: true, skipped: 'not_approved' });

    const userId = data.user_id;
    if (!userId) return Response.json({ ok: true, skipped: 'no_user_id' });

    // 1. Actualizar ProfessionalProfile
    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: userId });
    const profile = profiles[0];
    if (profile) {
      await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
        identity_verified: true,
        identity_verified_at: new Date().toISOString(),
        identity_document_type: data.document_type || '',
      });
    }

    // 2. Crear Notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      type: 'system',
      title: '✅ Identidad verificada',
      message: 'Tu identidad ha sido verificada. Ya apareces como Verificado en tu perfil y en los listados.',
      is_read: false,
    }).catch(() => {});

    // 3. Mensaje desde support_team
    const businessName = profile?.business_name || data.user_name || 'Profesional';
    const convId = `support_${userId}`;
    await base44.asServiceRole.entities.Message.create({
      conversation_id: convId,
      sender_id: 'support_team',
      recipient_id: userId,
      content: `🎉 ¡Enhorabuena, ${businessName}! Tu identidad ha sido verificada correctamente. Ahora apareces con el badge ✓ Verificado en todos los listados y en tu perfil público. Esto aumentará la confianza de los clientes y te ayudará a recibir más contactos. ¡Mucho éxito!`,
      professional_name: businessName,
      client_name: 'MisAutónomos',
      sender_name: 'MisAutónomos Support',
      is_read: false,
      attachments: [],
    }).catch(() => {});

    return Response.json({ ok: true, userId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});