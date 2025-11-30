import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const BASE_URL = 'https://misautonomos.es';

// Genera slug limpio: sin acentos, sin IDs aleatorios
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

const CATEGORY_SLUGS = {
  'Electricista': 'electricistas',
  'Fontanero': 'fontaneros',
  'Carpintero': 'carpinteros',
  'Pintor': 'pintores',
  'Jardinero': 'jardineros',
  'Transportista': 'transportistas',
  'Cerrajero': 'cerrajeros',
  'Albañil / Reformas': 'albanil-reformas',
  'Autónomo de limpieza': 'autonomo-de-limpieza',
  'Instalador de aire acondicionado': 'instalador-de-aire-acondicionado',
  'Mantenimiento general': 'mantenimiento-general',
  'Mantenimiento de piscinas': 'mantenimiento-de-piscinas',
  'Asesoría o gestoría': 'asesoria-o-gestoria',
  'Empresa multiservicios': 'empresa-multiservicios',
};

const MAIN_CITIES = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Zaragoza', 'Bilbao',
  'Murcia', 'Palma de Mallorca', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo',
  'Granada', 'A Coruña', 'Vitoria-Gasteiz'
];

Deno.serve(async (req) => {
  // Permitir acceso público al sitemap
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Obtener datos
    const [categories, profiles] = await Promise.all([
      base44.entities.ServiceCategory.list(),
      base44.entities.ProfessionalProfile.list()
    ]);
    
    const visibleProfiles = profiles.filter(p => 
      p.visible_en_busqueda === true && p.onboarding_completed === true
    );
    
    const today = new Date().toISOString().split('T')[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Páginas principales -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/Search</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/PricingPlans</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/HelpCenter</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/TermsConditions</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${BASE_URL}/PrivacyPolicy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${BASE_URL}/CookiePolicy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <!-- Categorías -->`;

    // Añadir categorías con URLs limpias usando query params
    for (const cat of categories) {
      const slug = CATEGORY_SLUGS[cat.name] || slugify(cat.name);
      xml += `
  <url>
    <loc>${BASE_URL}/Categoria?name=${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      
      // Añadir categoría + ciudad
      for (const city of MAIN_CITIES) {
        xml += `
  <url>
    <loc>${BASE_URL}/Categoria?name=${slug}&amp;ciudad=${slugify(city)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }

    xml += `
  
  <!-- Perfiles de profesionales -->`;

    // Añadir perfiles con URLs limpias usando query params
    for (const profile of visibleProfiles) {
      const slug = profile.slug_publico || slugify(profile.business_name);
      const lastMod = profile.updated_date ? profile.updated_date.split('T')[0] : today;
      
      // Prioridad más alta para perfiles con más reseñas
      const priority = profile.total_reviews >= 10 ? 0.8 : profile.total_reviews >= 5 ? 0.7 : 0.6;
      
      xml += `
  <url>
    <loc>${BASE_URL}/Autonomo?slug=${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    }
    
    // Añadir páginas adicionales importantes
    xml += `
  
  <!-- Páginas informativas -->
  <url>
    <loc>${BASE_URL}/FAQ</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/DashboardProInfo</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/LegalNotice</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`;

    xml += `
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Robots-Tag': 'noindex',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});