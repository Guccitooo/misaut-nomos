import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const baseUrl = 'https://misautonomos.es';
    const today = new Date().toISOString().split('T')[0];

    // Páginas estáticas públicas
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/Search', priority: '1.0', changefreq: 'daily' },
      { url: '/PricingPlans', priority: '0.9', changefreq: 'weekly' },
      { url: '/FAQ', priority: '0.8', changefreq: 'monthly' },
      { url: '/HelpCenter', priority: '0.8', changefreq: 'monthly' },
      { url: '/PrivacyPolicy', priority: '0.5', changefreq: 'yearly' },
      { url: '/TermsConditions', priority: '0.5', changefreq: 'yearly' },
      { url: '/CookiePolicy', priority: '0.5', changefreq: 'yearly' },
      { url: '/LegalNotice', priority: '0.5', changefreq: 'yearly' }
    ];

    // Obtener perfiles profesionales activos
    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
      visible_en_busqueda: true,
      onboarding_completed: true
    });

    // Obtener categorías
    const categories = await base44.asServiceRole.entities.ServiceCategory.list();

    // Construir XML del sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Añadir páginas estáticas
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Añadir perfiles profesionales
    profiles.forEach(profile => {
      if (profile.slug_publico) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/Autonomo?slug=${profile.slug_publico}</loc>\n`;
        xml += `    <lastmod>${profile.updated_date?.split('T')[0] || today}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.9</priority>\n`;
        xml += '  </url>\n';
      }
    });

    // Añadir páginas de categorías
    categories.forEach(category => {
      const slug = category.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/Categoria?name=${encodeURIComponent(category.name)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // Cache de 1 hora
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});