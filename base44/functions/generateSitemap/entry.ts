import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Obtener provincias únicas de perfiles activos
    const uniqueProvinces = [...new Set(profiles.map(p => p.provincia).filter(Boolean))];
    const uniqueCities = [...new Set(profiles.map(p => p.ciudad ? `${p.ciudad}, ${p.provincia}` : null).filter(Boolean))];

    // Construir XML del sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
    xml += 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    // Añadir páginas estáticas
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Añadir perfiles profesionales con imágenes
    profiles.forEach(profile => {
      if (profile.slug_publico) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/Autonomo?slug=${encodeURIComponent(profile.slug_publico)}</loc>\n`;
        xml += `    <lastmod>${profile.updated_date?.split('T')[0] || today}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.9</priority>\n`;
        
        // Añadir imágenes del perfil
        if (profile.imagen_principal) {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${profile.imagen_principal}</image:loc>\n`;
          xml += `      <image:title>${profile.business_name}</image:title>\n`;
          xml += `      <image:caption>${(profile.descripcion_corta || profile.categories?.[0] || '').substring(0, 100)}</image:caption>\n`;
          xml += `    </image:image>\n`;
        }
        
        // Añadir primeras 5 fotos del portfolio
        if (profile.photos && Array.isArray(profile.photos)) {
          profile.photos.slice(0, 5).forEach((photo) => {
            xml += `    <image:image>\n`;
            xml += `      <image:loc>${photo}</image:loc>\n`;
            xml += `      <image:title>${profile.business_name} - Trabajo realizado</image:title>\n`;
            xml += `    </image:image>\n`;
          });
        }
        
        xml += '  </url>\n';
      }
    });

    // Añadir páginas de categorías
    categories.forEach(category => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/Categoria?name=${encodeURIComponent(category.name)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += '  </url>\n';
    });

    // Añadir páginas de provincias
    uniqueProvinces.forEach(province => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/Search?provincia=${encodeURIComponent(province)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += '  </url>\n';
    });

    // Añadir páginas de ciudades
    uniqueCities.slice(0, 100).forEach(cityProvince => {
      const [city, prov] = cityProvince.split(', ');
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/Search?provincia=${encodeURIComponent(prov)}&ciudad=${encodeURIComponent(city)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += '  </url>\n';
    });

    // Añadir combinaciones categoría + provincia (top 50)
    const topCombinations = [];
    categories.forEach(cat => {
      uniqueProvinces.forEach(prov => {
        const count = profiles.filter(p => 
          p.categories?.includes(cat.name) && p.provincia === prov
        ).length;
        if (count > 0) {
          topCombinations.push({ category: cat.name, province: prov, count });
        }
      });
    });
    topCombinations.sort((a, b) => b.count - a.count).slice(0, 50).forEach(combo => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/Search?categoria=${encodeURIComponent(combo.category)}&provincia=${encodeURIComponent(combo.province)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
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