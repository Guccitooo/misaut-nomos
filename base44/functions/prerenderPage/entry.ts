/**
 * prerenderPage — Devuelve HTML completo con contenido real para bots/crawlers.
 *
 * Uso: GET /prerenderPage?path=/autonomo/electricista-en-madrid/juan-garcia
 *      GET /prerenderPage?path=/categoria/electricistas-en-madrid
 *      GET /prerenderPage?path=/blog/como-darse-de-alta-autonomo
 *      GET /prerenderPage?path=/buscar
 *      GET /prerenderPage?path=/
 *
 * Configurar en Cloudflare Workers / Vercel Edge / Nginx para servir esta respuesta
 * cuando el User-Agent sea Googlebot/bingbot/etc.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE_URL = 'https://misautonomos.es';
const DEFAULT_IMG = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/f1c507180_123.png';
const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildHtml({ title, description, canonical, ogImage, ogType = 'website', jsonLd = [], bodyHtml }) {
  const ldScripts = jsonLd.map(schema =>
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <!-- Open Graph -->
  <meta property="og:site_name" content="MisAutónomos" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:image" content="${escapeHtml(ogImage || DEFAULT_IMG)}" />
  <meta property="og:locale" content="es_ES" />
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@MisAutonomos" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage || DEFAULT_IMG)}" />
  <!-- Robots -->
  <meta name="robots" content="index, follow" />
  <!-- Structured Data -->
  ${ldScripts}
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#fff;color:#111827}
    .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
    h1{font-size:1.75rem;font-weight:700;margin:0 0 8px}
    h2{font-size:1.25rem;font-weight:600;margin:16px 0 8px}
    p{margin:0 0 8px;line-height:1.6}
    a{color:#2563eb;text-decoration:none}
    ul{padding-left:20px}
    .container{max-width:960px;margin:0 auto;padding:24px 16px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
    .card{border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#fff}
    .badge{display:inline-block;background:#eff6ff;color:#1d4ed8;border-radius:6px;padding:2px 8px;font-size:12px;font-weight:500}
    .stars{color:#f59e0b}
    nav{background:#1e3a8a;padding:12px 16px}
    nav a{color:#fff;font-weight:600;font-size:18px}
    footer{background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 16px;text-align:center;color:#6b7280;font-size:13px}
  </style>
</head>
<body>
  <nav>
    <a href="${BASE_URL}">MisAutónomos</a>
    <span style="color:#93c5fd;margin-left:16px;font-size:13px">Encuentra profesionales verificados en España</span>
  </nav>
  <div class="container">
    ${bodyHtml}
  </div>
  <footer>
    <p>© ${new Date().getFullYear()} MisAutónomos · <a href="/precios">Planes</a> · <a href="/buscar">Buscar profesionales</a> · <a href="/blog">Blog</a></p>
  </footer>
</body>
</html>`;
}

// ── HANDLERS por tipo de ruta ──────────────────────────────────────────────

async function handleAutonomo(base44, slug) {
  const allProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
    visible_en_busqueda: true,
    onboarding_completed: true
  });

  // Buscar por slug_publico o match parcial
  const profile = allProfiles.find(p => p.slug_publico === slug)
    || allProfiles.find(p => slugify(p.business_name) === slug)
    || allProfiles.find(p => p.slug_publico && p.slug_publico.startsWith(slug));

  if (!profile) return null;

  const category = profile.categories?.[0] || 'Profesional';
  const location = profile.ciudad || profile.provincia || 'España';
  const categorySlug = slugify(category);
  const citySlug = slugify(profile.ciudad || '');
  const canonical = profile.ciudad
    ? `${BASE_URL}/autonomo/${categorySlug}-en-${citySlug}/${profile.slug_publico || slug}`
    : `${BASE_URL}/autonomo/${profile.slug_publico || slug}`;

  const ratingText = profile.average_rating > 0 ? `★${profile.average_rating.toFixed(1)} (${profile.total_reviews} opiniones). ` : '';
  const expText = profile.years_experience > 0 ? `${profile.years_experience} años de experiencia. ` : '';
  const title = `${profile.business_name} - ${category} en ${location} | MisAutónomos`;
  const description = `${ratingText}${expText}${profile.descripcion_corta || `Servicios de ${category.toLowerCase()} en ${location}`}. Contacta gratis.`.slice(0, 160);

  // JSON-LD LocalBusiness
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": profile.business_name,
    "description": profile.descripcion_corta || description,
    "url": canonical,
    "image": profile.imagen_principal || DEFAULT_IMG,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": profile.ciudad || '',
      "addressRegion": profile.provincia || '',
      "addressCountry": "ES"
    },
    "areaServed": profile.service_area || location,
    "priceRange": profile.price_range || "€€",
    ...(profile.average_rating > 0 && profile.total_reviews > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": profile.average_rating.toFixed(1),
        "reviewCount": profile.total_reviews,
        "bestRating": "5",
        "worstRating": "1"
      }
    } : {}),
    ...(profile.telefono_contacto ? { "telephone": profile.telefono_contacto } : {})
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "Buscar", "item": `${BASE_URL}/buscar` },
      { "@type": "ListItem", "position": 3, "name": category, "item": `${BASE_URL}/categoria/${categorySlug}` },
      { "@type": "ListItem", "position": 4, "name": profile.business_name, "item": canonical }
    ]
  };

  // FAQ si tiene
  const faqJsonLd = profile.faq_items?.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": profile.faq_items.filter(f => f.question && f.answer).map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer }
    }))
  } : null;

  const skillsHtml = profile.skills?.length > 0
    ? `<ul>${profile.skills.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : '';
  const servicesHtml = profile.services_offered?.length > 0
    ? `<h2>Servicios ofrecidos</h2><ul>${profile.services_offered.map(s => `<li><strong>${escapeHtml(s.name)}</strong>${s.description ? ' — ' + escapeHtml(s.description) : ''}${s.price ? ` (desde ${escapeHtml(s.price)}€)` : ''}</li>`).join('')}</ul>` : '';

  const bodyHtml = `
    <nav aria-label="breadcrumb" style="font-size:13px;color:#6b7280;margin-bottom:16px">
      <a href="${BASE_URL}">Inicio</a> › 
      <a href="${BASE_URL}/categoria/${categorySlug}">${escapeHtml(category)}</a> › 
      <span>${escapeHtml(profile.business_name)}</span>
    </nav>

    <h1>${escapeHtml(profile.business_name)}</h1>
    <p><span class="badge">${escapeHtml(category)}</span> · 📍 ${escapeHtml(location)}${profile.average_rating > 0 ? ` · <span class="stars">★ ${profile.average_rating.toFixed(1)}</span> (${profile.total_reviews} opiniones)` : ''}</p>

    ${profile.descripcion_corta ? `<p style="color:#374151">${escapeHtml(profile.descripcion_corta)}</p>` : ''}
    ${profile.description && profile.description !== profile.descripcion_corta ? `<p style="color:#6b7280">${escapeHtml(profile.description)}</p>` : ''}
    ${profile.years_experience > 0 ? `<p><strong>${profile.years_experience} años de experiencia</strong></p>` : ''}
    ${profile.tarifa_base > 0 ? `<p><strong>Desde ${profile.tarifa_base}€/hora</strong></p>` : ''}

    ${servicesHtml}
    ${skillsHtml ? `<h2>Especialidades</h2>${skillsHtml}` : ''}

    <h2>Zona de servicio</h2>
    <p>${escapeHtml(profile.service_area || location)}</p>

    <p><a href="${BASE_URL}${canonical}" style="display:inline-block;margin-top:16px;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;font-weight:600">Ver perfil completo y contactar →</a></p>

    <p style="margin-top:24px"><a href="${BASE_URL}/categoria/${categorySlug}-en-${citySlug}">← Ver más ${escapeHtml(category.toLowerCase())}s en ${escapeHtml(profile.ciudad || '')}</a></p>
  `;

  return buildHtml({
    title,
    description,
    canonical,
    ogImage: profile.imagen_principal || DEFAULT_IMG,
    ogType: 'profile',
    jsonLd: [localBusiness, breadcrumb, ...(faqJsonLd ? [faqJsonLd] : [])],
    bodyHtml
  });
}

async function handleCategoria(base44, cityCategory) {
  let categorySlug, ciudadSlug, ciudadName;

  if (cityCategory.includes('-en-')) {
    const idx = cityCategory.indexOf('-en-');
    categorySlug = cityCategory.slice(0, idx);
    ciudadSlug = cityCategory.slice(idx + 4);
    ciudadName = ciudadSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  } else {
    categorySlug = cityCategory;
  }

  const CATEGORY_MAP = {
    electricistas: 'Electricista', fontaneros: 'Fontanero', carpinteros: 'Carpintero',
    pintores: 'Pintor', jardineros: 'Jardinero', cerrajeros: 'Cerrajero',
    albaniles: 'Albañil / Reformas', 'albanil-reformas': 'Albañil / Reformas',
    limpieza: 'Autónomo de limpieza', 'aire-acondicionado': 'Instalador de aire acondicionado',
    mantenimiento: 'Mantenimiento general', piscinas: 'Mantenimiento de piscinas',
    asesoria: 'Asesoría o gestoría', multiservicios: 'Empresa multiservicios',
    transportistas: 'Transportista'
  };
  const categoryName = CATEGORY_MAP[categorySlug] || categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const allProfiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
    visible_en_busqueda: true, onboarding_completed: true
  });

  const profiles = allProfiles.filter(p => {
    const matchesCat = p.categories?.some(c => slugify(c) === categorySlug || slugify(c) + 's' === categorySlug);
    const matchesCity = !ciudadName || slugify(p.ciudad || '') === ciudadSlug;
    return matchesCat && matchesCity;
  });

  const canonical = ciudadName
    ? `${BASE_URL}/categoria/${categorySlug}-en-${ciudadSlug}`
    : `${BASE_URL}/categoria/${categorySlug}`;

  const title = ciudadName
    ? `${categoryName}s en ${ciudadName} - MisAutónomos`
    : `${categoryName}s en España - Directorio de profesionales | MisAutónomos`;
  const description = ciudadName
    ? `Encuentra ${profiles.length} ${categoryName.toLowerCase()}s verificados en ${ciudadName}. Contacta gratis, pide presupuesto sin compromiso.`
    : `Directorio de ${categoryName.toLowerCase()}s autónomos en España. ${profiles.length} profesionales verificados. Compara precios y contacta gratis.`;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": title,
    "description": description,
    "numberOfItems": profiles.length,
    "itemListElement": profiles.slice(0, 20).map((p, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "LocalBusiness",
        "name": p.business_name,
        "url": `${BASE_URL}/autonomo/${categorySlug}-en-${slugify(p.ciudad || '')}/${p.slug_publico}`,
        "address": { "@type": "PostalAddress", "addressLocality": p.ciudad, "addressRegion": p.provincia, "addressCountry": "ES" },
        ...(p.average_rating > 0 ? { "aggregateRating": { "@type": "AggregateRating", "ratingValue": p.average_rating, "reviewCount": p.total_reviews } } : {})
      }
    }))
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "Buscar", "item": `${BASE_URL}/buscar` },
      { "@type": "ListItem", "position": 3, "name": `${categoryName}s`, "item": `${BASE_URL}/categoria/${categorySlug}` },
      ...(ciudadName ? [{ "@type": "ListItem", "position": 4, "name": ciudadName, "item": canonical }] : [])
    ]
  };

  const profileCards = profiles.slice(0, 30).map(p => `
    <div class="card">
      <h2 style="font-size:16px;margin:0 0 4px"><a href="${BASE_URL}/autonomo/${categorySlug}-en-${slugify(p.ciudad || '')}/${p.slug_publico}">${escapeHtml(p.business_name)}</a></h2>
      <p style="font-size:13px;color:#6b7280;margin:0 0 6px">📍 ${escapeHtml(p.ciudad || p.provincia || 'España')}${p.average_rating > 0 ? ` · <span class="stars">★ ${p.average_rating.toFixed(1)}</span>` : ''}</p>
      ${p.descripcion_corta ? `<p style="font-size:13px;color:#374151">${escapeHtml(p.descripcion_corta)}</p>` : ''}
    </div>
  `).join('');

  const bodyHtml = `
    <nav aria-label="breadcrumb" style="font-size:13px;color:#6b7280;margin-bottom:16px">
      <a href="${BASE_URL}">Inicio</a> › 
      <a href="${BASE_URL}/categoria/${categorySlug}">${escapeHtml(categoryName)}s</a>
      ${ciudadName ? ` › <span>${escapeHtml(ciudadName)}</span>` : ''}
    </nav>
    <h1>${escapeHtml(categoryName)}s${ciudadName ? ` en ${escapeHtml(ciudadName)}` : ' en España'}</h1>
    <p style="color:#6b7280;margin-bottom:24px">${profiles.length} profesionales verificados disponibles</p>
    ${profiles.length > 0 ? `<div class="grid">${profileCards}</div>` : `<p>Aún no hay ${categoryName.toLowerCase()}s registrados${ciudadName ? ` en ${ciudadName}` : ''}.</p>`}
    <p style="margin-top:32px"><a href="${BASE_URL}/buscar">← Ver todos los profesionales</a></p>
  `;

  return buildHtml({ title, description, canonical, jsonLd: [itemList, breadcrumb], bodyHtml });
}

async function handleBlogPost(base44, slug) {
  const posts = await base44.asServiceRole.entities.BlogPost.filter({ slug, status: 'published' }, '-publish_date', 1);
  const post = posts[0];
  if (!post) return null;

  const canonical = `${BASE_URL}/blog/${post.slug}`;
  const title = post.meta_title_es || `${post.title_es} | Blog MisAutónomos`;
  const description = post.meta_description_es || post.excerpt_es || '';
  const ogImage = post.og_image || post.featured_image || DEFAULT_IMG;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title_es,
    "description": description,
    "image": ogImage,
    "url": canonical,
    "author": { "@type": "Person", "name": post.author_name || "Equipo MisAutónomos" },
    "publisher": {
      "@type": "Organization", "name": "MisAutónomos",
      "logo": { "@type": "ImageObject", "url": LOGO_URL }
    },
    "datePublished": post.publish_date,
    "dateModified": post.updated_date || post.publish_date,
    "mainEntityOfPage": canonical
  };

  // Convertir HTML del post a texto plano (básico) para el prerender
  const contentText = (post.content_es || '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);

  const bodyHtml = `
    <nav aria-label="breadcrumb" style="font-size:13px;color:#6b7280;margin-bottom:16px">
      <a href="${BASE_URL}">Inicio</a> › <a href="${BASE_URL}/blog">Blog</a> › <span>${escapeHtml(post.title_es)}</span>
    </nav>
    ${post.featured_image ? `<img src="${escapeHtml(post.featured_image)}" alt="${escapeHtml(post.title_es)}" style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin-bottom:24px" />` : ''}
    <h1>${escapeHtml(post.title_es)}</h1>
    <p style="color:#6b7280;font-size:14px">Por ${escapeHtml(post.author_name || 'Equipo MisAutónomos')} · ${post.read_time_minutes || 5} min lectura · ${post.publish_date ? new Date(post.publish_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
    ${post.excerpt_es ? `<p style="font-size:1.1rem;color:#374151;font-weight:500;margin:16px 0">${escapeHtml(post.excerpt_es)}</p>` : ''}
    <div style="color:#374151;line-height:1.7">${post.content_es || escapeHtml(contentText)}</div>
    <p style="margin-top:32px"><a href="${BASE_URL}/blog">← Volver al blog</a></p>
  `;

  return buildHtml({ title, description, canonical, ogImage, ogType: 'article', jsonLd: [jsonLd], bodyHtml });
}

async function handleBlogList(base44) {
  const posts = await base44.asServiceRole.entities.BlogPost.filter({ status: 'published' }, '-publish_date', 20);
  const canonical = `${BASE_URL}/blog`;
  const title = 'Blog MisAutónomos — Consejos para autónomos en España';
  const description = 'Guías fiscales, herramientas y consejos prácticos para autónomos y clientes en España.';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": title,
    "description": description,
    "url": canonical,
    "blogPost": posts.slice(0, 10).map(p => ({
      "@type": "BlogPosting",
      "headline": p.title_es,
      "url": `${BASE_URL}/blog/${p.slug}`,
      "datePublished": p.publish_date,
      "description": p.excerpt_es || ''
    }))
  };

  const postCards = posts.map(p => `
    <div class="card">
      ${p.featured_image ? `<img src="${escapeHtml(p.featured_image)}" alt="${escapeHtml(p.title_es)}" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin-bottom:12px" loading="lazy" />` : ''}
      <h2 style="font-size:16px;margin:0 0 6px"><a href="${BASE_URL}/blog/${p.slug}">${escapeHtml(p.title_es)}</a></h2>
      ${p.excerpt_es ? `<p style="font-size:13px;color:#6b7280">${escapeHtml(p.excerpt_es)}</p>` : ''}
    </div>
  `).join('');

  const bodyHtml = `
    <h1>Blog MisAutónomos</h1>
    <p style="color:#6b7280;margin-bottom:24px">Consejos prácticos, guías fiscales y herramientas para autónomos en España.</p>
    <div class="grid">${postCards}</div>
  `;

  return buildHtml({ title, description, canonical, jsonLd: [jsonLd], bodyHtml });
}

async function handleHome(base44) {
  const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
    visible_en_busqueda: true, onboarding_completed: true
  });

  const canonical = `${BASE_URL}/buscar`;
  const title = 'MisAutónomos - Encuentra autónomos y profesionales verificados en España';
  const description = `Conecta con los mejores profesionales autónomos verificados cerca de ti. ${profiles.length}+ profesionales activos. Electricistas, fontaneros, carpinteros y más. 100% gratis para clientes.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MisAutónomos",
    "url": BASE_URL,
    "description": description,
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": `${BASE_URL}/buscar?q={search_term_string}` },
      "query-input": "required name=search_term_string"
    }
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MisAutónomos",
    "url": BASE_URL,
    "logo": { "@type": "ImageObject", "url": LOGO_URL },
    "description": description,
    "areaServed": { "@type": "Country", "name": "España" }
  };

  // Top categorías con conteo
  const categoryCounts = {};
  profiles.forEach(p => {
    (p.categories || []).forEach(c => { categoryCounts[c] = (categoryCounts[c] || 0) + 1; });
  });
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 12);

  const categoryLinks = topCategories.map(([cat, count]) =>
    `<li><a href="${BASE_URL}/categoria/${slugify(cat)}">${escapeHtml(cat)} (${count})</a></li>`
  ).join('');

  const bodyHtml = `
    <h1>Encuentra profesionales autónomos verificados en España</h1>
    <p style="font-size:1.1rem;color:#374151;margin-bottom:24px">
      Conecta con ${profiles.length}+ profesionales verificados. Electricistas, fontaneros, carpinteros y más. Gratis para clientes.
    </p>
    <p><a href="${BASE_URL}/buscar" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;font-weight:600;font-size:16px">Buscar profesionales →</a></p>

    <h2 style="margin-top:40px">Categorías populares</h2>
    <ul style="columns:2;column-gap:16px">${categoryLinks}</ul>

    <h2 style="margin-top:32px">¿Por qué MisAutónomos?</h2>
    <ul>
      <li>Profesionales verificados con identidad comprobada</li>
      <li>Opiniones reales de clientes verificados</li>
      <li>Contacto directo: chat, WhatsApp o teléfono</li>
      <li>100% gratuito para clientes</li>
      <li>Presupuestos sin compromiso</li>
    </ul>

    <p style="margin-top:32px"><a href="${BASE_URL}/precios">¿Eres autónomo? Regístrate y consigue más clientes →</a></p>
  `;

  return buildHtml({ title, description, canonical, jsonLd: [jsonLd, orgJsonLd], bodyHtml });
}

// ── ROUTER PRINCIPAL ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let path = url.searchParams.get('path') || null;
    // También soportar path desde body JSON (para tests y llamadas POST)
    if (!path && req.method === 'POST') {
      try {
        const body = await req.json();
        path = body.path || '/';
      } catch { path = '/'; }
    }
    path = path || '/';

    const base44 = createClientFromRequest(req);

    let html = null;

    // Determinar tipo de ruta
    const autonomoTwoSegments = path.match(/^\/autonomo\/([^/]+)\/([^/]+)\/?$/);
    const autonomoOneSegment = path.match(/^\/autonomo\/([^/]+)\/?$/);
    const categoriaMatch = path.match(/^\/categoria\/([^?/]+)\/?$/);
    const blogPostMatch = path.match(/^\/blog\/([^/]+)\/?$/);

    if (autonomoTwoSegments) {
      html = await handleAutonomo(base44, autonomoTwoSegments[2]);
    } else if (autonomoOneSegment) {
      html = await handleAutonomo(base44, autonomoOneSegment[1]);
    } else if (categoriaMatch) {
      html = await handleCategoria(base44, categoriaMatch[1]);
    } else if (blogPostMatch) {
      html = await handleBlogPost(base44, blogPostMatch[1]);
    } else if (path === '/blog' || path === '/blog/') {
      html = await handleBlogList(base44);
    } else {
      // Home / buscar / precios / etc.
      html = await handleHome(base44);
    }

    if (!html) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        'X-Prerender': 'true'
      }
    });

  } catch (error) {
    console.error('prerenderPage error:', error.message);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});