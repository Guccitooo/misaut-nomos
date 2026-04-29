import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const messages = await base44.asServiceRole.entities.Message.list();
    const toFix = messages.filter(m => !m.sender_name);
    console.log(`Total messages: ${messages.length}, to fix: ${toFix.length}`);

    let updated = 0;
    let errors = 0;
    const senderCache = new Map();

    for (const msg of toFix) {
      try {
        // Mensajes del sistema de soporte
        if (msg.sender_id === 'support_team') {
          await base44.asServiceRole.entities.Message.update(msg.id, { sender_name: 'Soporte MisAutónomos' });
          updated++;
          continue;
        }

        let senderName = senderCache.get(msg.sender_id);

        if (!senderName) {
          const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({ user_id: msg.sender_id });
          if (profiles?.[0]?.business_name) {
            senderName = profiles[0].business_name;
          } else {
            const users = await base44.asServiceRole.entities.User.filter({ id: msg.sender_id });
            if (users?.[0]?.full_name) senderName = users[0].full_name;
          }
          if (senderName) senderCache.set(msg.sender_id, senderName);
        }

        if (senderName) {
          await base44.asServiceRole.entities.Message.update(msg.id, { sender_name: senderName });
          updated++;
        } else {
          errors++;
        }
      } catch (e) {
        console.error('Backfill error for', msg.id, ':', e.message);
        errors++;
      }
    }

    return Response.json({
      success: true,
      total_messages: messages.length,
      to_fix: toFix.length,
      updated,
      errors
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});