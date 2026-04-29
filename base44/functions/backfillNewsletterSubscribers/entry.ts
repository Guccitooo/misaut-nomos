import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('🔄 Iniciando backfill de NewsletterSubscriber...');

    const users = await base44.asServiceRole.entities.User.list();
    console.log('👥 Total users:', users.length);

    const existingSubs = await base44.asServiceRole.entities.NewsletterSubscriber.list();
    const existingEmails = new Set(existingSubs.map(s => s.email.toLowerCase()));
    console.log('📧 Ya suscritos:', existingEmails.size);

    const toSubscribe = users.filter(u => u.email && !existingEmails.has(u.email.toLowerCase()));
    console.log('➕ A migrar:', toSubscribe.length);

    let created = 0;
    let errors = 0;

    for (const u of toSubscribe) {
      try {
        const userTypeInterest = u.user_type === 'professionnel'
          ? 'autonomo'
          : u.user_type === 'client'
            ? 'cliente'
            : 'ambos';

        const tags = ['migrated_from_users'];
        if (u.user_type === 'professionnel') tags.push('professional');
        else if (u.user_type === 'client') tags.push('client');

        await base44.asServiceRole.entities.NewsletterSubscriber.create({
          email: u.email,
          name: u.full_name || '',
          source: 'backfill_existing_users',
          status: 'confirmed',
          language: 'es',
          user_type_interest: userTypeInterest,
          tags,
          confirmation_token: 'mig_' + Math.random().toString(36).substring(2, 14),
          confirmed_at: new Date().toISOString(),
          unsubscribe_token: 'unsub_' + Math.random().toString(36).substring(2, 16),
        });
        created++;
      } catch (e) {
        console.error('Error creando subscriber para', u.email, ':', e.message);
        errors++;
      }
    }

    return Response.json({
      success: true,
      total_users: users.length,
      already_subscribed: existingEmails.size,
      created,
      errors,
      message: `Backfill completado: ${created} suscritos, ${errors} errores.`
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});