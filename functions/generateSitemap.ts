import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const BASE_URL = 'https://misautonomos.es';

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
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
      
      xml += `
  <url>
    <loc>${BASE_URL}/Autonomo?slug=${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});