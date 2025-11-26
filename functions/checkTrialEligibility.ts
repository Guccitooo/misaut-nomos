import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHash } from 'node:crypto';

function hashIdentifier(identifier) {
  if (!identifier) return null;
  return createHash('sha256').update(identifier).digest('hex');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nif, phone } = await req.json();

    if (!nif && !phone) {
      return Response.json({ error: 'NIF or phone is required' }, { status: 400 });
    }

    const nifHash = hashIdentifier(nif);
    const phoneHash = hashIdentifier(phone);

    const queryConditions = [];
    if (nifHash) queryConditions.push({ identifier_hash: nifHash });
    if (phoneHash) queryConditions.push({ identifier_hash: phoneHash });
    
    const existingTrials = await base44.asServiceRole.entities.TrialUsageLog.filter({
      $or: queryConditions
    });

    if (existingTrials.length > 0) {
      return Response.json({ eligibleForTrial: false, reason: 'Identifier already used' });
    }

    return Response.json({ eligibleForTrial: true });

  } catch (error) {
    console.error('Error checking trial eligibility:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});