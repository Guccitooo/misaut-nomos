import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verificar autenticación
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageIds } = await req.json();
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return Response.json({ updated: 0 });
    }

    // Usar asServiceRole para bypasear la RLS (el recipient no puede hacer update)
    let updated = 0;
    for (const id of messageIds) {
      try {
        await base44.asServiceRole.entities.Message.update(id, { is_read: true });
        updated++;
      } catch (e) {
        console.warn('Failed to mark message as read:', id, e.message);
      }
    }

    return Response.json({ updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});