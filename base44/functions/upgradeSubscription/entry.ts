import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  console.log('[upgradeSubscription] DESACTIVADA temporalmente. No se realizó ningún cambio.');
  return Response.json({
    ok: false,
    message: 'Función de upgrade desactivada temporalmente por mantenimiento.',
    disabled: true
  });
});