import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Entity automation: triggered on Review create/update/delete.
 * Recalcula average_rating y total_reviews en el ProfessionalProfile correspondiente.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data, event } = payload;
    const professionalId = data?.professional_id;

    if (!professionalId) return Response.json({ ok: true, skipped: 'no_professional_id' });

    // Obtener todas las reviews no reportadas de este profesional
    const allReviews = await base44.asServiceRole.entities.Review.filter({ professional_id: professionalId });
    const validReviews = allReviews.filter(r => !r.is_reported);

    const total = validReviews.length;
    const avg = total > 0
      ? Math.round((validReviews.reduce((s, r) => s + (r.rating || 0), 0) / total) * 10) / 10
      : 0;

    // Actualizar ProfessionalProfile
    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: professionalId });
    if (profiles[0]) {
      await base44.asServiceRole.entities.ProfessionalProfile.update(profiles[0].id, {
        average_rating: avg,
        total_reviews: total,
      });
    }

    // Notificar al profesional si es una nueva review
    if (event?.type === 'create' && profiles[0]) {
      const reviewerName = data.client_name || 'Un cliente';
      const rating = data.rating || 0;
      await base44.asServiceRole.entities.Notification.create({
        user_id: professionalId,
        type: 'new_review',
        title: `⭐ Nueva valoración de ${reviewerName}`,
        message: `${reviewerName} te ha valorado con ${rating}/5${data.comment ? ': "' + data.comment.slice(0, 80) + (data.comment.length > 80 ? '…' : '') + '"' : '.'}`,
        is_read: false,
      }).catch(() => {});
    }

    return Response.json({ ok: true, total, avg });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});