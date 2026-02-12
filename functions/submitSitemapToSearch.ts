import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Solo admin puede ejecutar esta función
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const sitemapUrl = 'https://misautonomos.es/api/functions/generateSitemap';
    const results = {
      google: { success: false, error: null },
      bing: { success: false, error: null }
    };

    // 1. Enviar a Google Search Console
    try {
      console.log('📤 Enviando sitemap a Google...');
      const googleResponse = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { method: 'GET' }
      );
      
      if (googleResponse.ok || googleResponse.status === 200) {
        results.google.success = true;
        console.log('✅ Sitemap enviado a Google');
      } else {
        results.google.error = `HTTP ${googleResponse.status}`;
        console.log('⚠️ Google respondió con:', googleResponse.status);
      }
    } catch (googleError) {
      results.google.error = googleError.message;
      console.error('❌ Error enviando a Google:', googleError.message);
    }

    // 2. Enviar a Bing Webmaster Tools
    try {
      console.log('📤 Enviando sitemap a Bing...');
      const bingResponse = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { method: 'GET' }
      );
      
      if (bingResponse.ok || bingResponse.status === 200) {
        results.bing.success = true;
        console.log('✅ Sitemap enviado a Bing');
      } else {
        results.bing.error = `HTTP ${bingResponse.status}`;
        console.log('⚠️ Bing respondió con:', bingResponse.status);
      }
    } catch (bingError) {
      results.bing.error = bingError.message;
      console.error('❌ Error enviando a Bing:', bingError.message);
    }

    // Registrar estadísticas en base de datos
    await base44.asServiceRole.entities.ProfileMetrics.create({
      professional_id: 'system',
      date: new Date().toISOString().split('T')[0],
      search_appearances: results.google.success && results.bing.success ? 2 : 
                         results.google.success || results.bing.success ? 1 : 0
    }).catch(() => console.log('No se pudo registrar métrica'));

    const successCount = (results.google.success ? 1 : 0) + (results.bing.success ? 1 : 0);

    return Response.json({
      ok: successCount > 0,
      message: `Sitemap enviado exitosamente a ${successCount}/2 motores de búsqueda`,
      sitemap_url: sitemapUrl,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    return Response.json({ 
      error: error.message,
      ok: false
    }, { status: 500 });
  }
});