import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const scheduled = await base44.asServiceRole.entities.BlogPost.filter({ status: 'scheduled' });
    let count = 0;
    for (const p of scheduled) {
      if (p.publish_date && new Date(p.publish_date) <= now) {
        await base44.asServiceRole.entities.BlogPost.update(p.id, { status: 'published' });
        count++;
      }
    }
    return Response.json({ published: count, checked: scheduled.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});