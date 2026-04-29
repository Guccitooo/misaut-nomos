import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const baseUrl = 'https://misautonomos.es';
    const today = new Date().toISOString().split('T')[0];

    // Páginas estáticas públicas — usar URLs ES canónicas
    const staticPages = [
      { url: '/buscar', priority: '1.0', changefreq: 'daily' },
      { url: '/precios', priority: '0.9', changefreq: 'weekly' },
      { url: '/preguntas-frecuentes', priority: '0.8', changefreq: 'monthly' },
      { url: '/ayuda', priority: '0.8', changefreq: 'monthly' },
      { url: '/blog', priority: '0.8', changefreq: 'weekly' },
      { url: '/privacidad', priority: '0.4', changefreq: 'yearly' },
      { url: '/terminos', priority: '0.4', changefreq: 'yearly' },
      { url: '/cookies', priority: '0.3', changefreq: 'yearly' },
      { url: '/aviso-legal', priority: '0.3', changefreq: 'yearly' }
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

    // Helper slugify (equivalente Deno del helper frontend)
    const slugify = (text) => {
      if (!text) return '';
      return text.toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/ñ/g, 'n')
        .replace(/[^a-z0-9\s-]/g, '').trim()
        .replace(/\s+/g, '-').replace(/-+/g, '-');
    };
    const getProfileSeoUrl = (profile) => {
      const nameSlug = profile.slug_publico || slugify(profile.business_name || '');
      if (!nameSlug) return null;
      const categoria = profile.categories?.[0];
      const ciudad = profile.ciudad;
      if (categoria && ciudad) return `/autonomo/${slugify(categoria)}-en-${slugify(ciudad)}/${nameSlug}`;
      return `/autonomo/${nameSlug}`;
    };

    // Añadir perfiles profesionales con imágenes
    profiles.forEach(profile => {
      const profileUrl = getProfileSeoUrl(profile);
      if (profileUrl) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${profileUrl}</loc>\n`;
        xml += `    <lastmod>${(profile.updated_date || today).split('T')[0]}</lastmod>\n`;
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
      xml += `    <loc>${baseUrl}/categoria/${encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, '-'))}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += '  </url>\n';
    });

    // Añadir páginas de provincias
    uniqueProvinces.forEach(province => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/buscar?provincia=${encodeURIComponent(province)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += '  </url>\n';
    });

    // Añadir páginas de ciudades
    uniqueCities.slice(0, 100).forEach(cityProvince => {
      const [city, prov] = cityProvince.split(', ');
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/buscar?provincia=${encodeURIComponent(prov)}&ciudad=${encodeURIComponent(city)}</loc>\n`;
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
      xml += `    <loc>${baseUrl}/buscar?categoria=${encodeURIComponent(combo.category)}&provincia=${encodeURIComponent(combo.province)}</loc>\n`;
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