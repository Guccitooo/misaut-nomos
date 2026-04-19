import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Solo admin puede ejecutar este backfill
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Obtener todas las verificaciones aprobadas
    const approved = await base44.entities.IdentityVerification.filter({ status: 'approved' });
    
    let updated = 0;
    let skipped = 0;
    
    for (const v of approved) {
      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: v.user_id });
      const profile = profiles[0];
      if (profile && !profile.identity_verified) {
        await base44.entities.ProfessionalProfile.update(profile.id, {
          identity_verified: true,
          identity_verified_at: v.reviewed_date || v.updated_date,
          identity_document_type: v.document_type
        });
        updated++;
      } else {
        skipped++;
      }
    }
    
    return Response.json({
      success: true,
      message: `Backfill completado: ${updated} perfiles actualizados, ${skipped} ya estaban sincronizados`,
      updated,
      skipped
    });
  } catch (error) {
    console.error('Error en backfill:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});