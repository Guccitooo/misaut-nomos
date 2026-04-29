/**
 * onSubscriptionGifted — dispara syncAdsPlusStatus cuando se aplica un regalo (gifted_plan_id cambia).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { data } = payload;
    const userId = data?.user_id;

    if (!userId) return Response.json({ ok: true, skipped: 'no_user_id' });

    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.functions.invoke('syncAdsPlusStatus', { userId });

    console.log(`[onSubscriptionGifted] syncAdsPlusStatus ejecutado para user=${userId}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('[onSubscriptionGifted] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});