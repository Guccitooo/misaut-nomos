// scripts/prerender.mjs
// Prerender estático post-build: genera dist/<ruta>/index.html para todas las
// rutas SEO con <title>, meta description, canonical, OG, JSON-LD y contenido
// real (H1 + intro + listing snippet) renderizado en HTML, manteniendo el
// bundle SPA para hidratación cliente.
//
// Lee el template dist/index.html (output de vite build), saca datos en vivo
// de Supabase (anon key) y escribe HTMLs derivados.
//
// Tipos de ruta cubiertos:
//   - Estáticas: /, /buscar, /preguntas-frecuentes, /ayuda, /blog,
//     /para-autonomos, /privacidad, /terminos, /cookies, /aviso-legal, /contacto
//   - /categoria/{slug}                       (17 categorías)
//   - /autonomo/{cat-en-ciudad}/{slug}        (profiles con visible_en_busqueda)
//   - /blog/{slug}                            (blog_posts published)
//   - /categoria/{slug}/{ciudad-slug}         (CITY × CATEGORY, candado ≥3)
//
// Candado de densidad: combinaciones ciudad×categoría con < N pros no se
// prerenderizan, para evitar doorway pages. N = MIN_PROS_POR_CIUDAD_CATEGORIA.

import { createClient } from '@supabase/supabase-js';
import { EDITORIAL_GUIDES } from '../src/lib/guiasLocales.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from '../src/lib/slugify.js';
import sanitizeHtml from 'sanitize-html';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Cargar .env.local si existe (Node no lo hace solo).
// En Vercel las vars vienen ya en process.env, así que este bloque solo
// añade lo que falte sin pisar.
for (const envFile of ['.env.local', '.env']) {
  const p = path.join(ROOT, envFile);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Configuración
// ──────────────────────────────────────────────────────────────────────────
const SITE = 'https://misautonomos.es';
const SITE_NAME = 'MisAutónomos';
const OG_IMAGE = 'https://misautonomos.es/og-image.png';
const MIN_PROS_POR_CIUDAD_CATEGORIA = 3;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://dquxsethatxtptfviiwd.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('[prerender] Falta VITE_SUPABASE_ANON_KEY — abort');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ──────────────────────────────────────────────────────────────────────────
// Utils HTML
// ──────────────────────────────────────────────────────────────────────────
const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const stripHtml = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const truncate = (s, n) => {
  const t = stripHtml(s);
  if (t.length <= n) return t;
  return t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
};

const safeContent = (html) => sanitizeHtml(html || '', {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
  allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'width', 'height', 'loading'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: { h1: 'h2' },
});

const jsonForHtml = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

function linkList(items) {
  return `<ul>${items.map(({ href, label }) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join('')}</ul>`;
}

// Limpia un slug heredado que pueda tener caracteres no-ASCII o guiones colgantes.
// Si el slug normalizado difiere del original, devolvemos ambos para crear 301.
function normalizeSlug(raw) {
  const clean = slugify(raw || '').replace(/-+$/, '').replace(/^-+/, '');
  return { clean, changed: clean !== raw, original: raw };
}

// ──────────────────────────────────────────────────────────────────────────
// Template loader: inserta meta/title/OG/JSON-LD/contenido en el index.html
// ──────────────────────────────────────────────────────────────────────────

function loadTemplate() {
  const tplPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(tplPath)) {
    console.error('[prerender] No existe dist/index.html — ¿ejecutaste vite build?');
    process.exit(1);
  }
  return fs.readFileSync(tplPath, 'utf8');
}

/**
 * Aplica meta SEO + first-paint HTML al template.
 * @param {string} tpl  Template HTML (dist/index.html).
 * @param {object} cfg  Config de la ruta.
 *   {title, description, canonical, image, ogType, jsonLd, h1, intro, listingHtml, noindex}
 */
function renderTemplate(tpl, cfg) {
  let html = tpl;

  const title = cfg.title || `${SITE_NAME}`;
  const desc = cfg.description || 'Encuentra autónomos verificados en España.';
  const canonical = cfg.canonical;
  const image = cfg.image || OG_IMAGE;
  const ogType = cfg.ogType || 'website';

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);

  // <meta name="description">
  html = html.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${escapeHtml(desc)}" />`,
  );

  // <link rel="canonical">
  html = html.replace(
    /<link\s+rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
  );

  // OG / Twitter — sustitución por nombre de property
  const ogPairs = {
    'og:title': title,
    'og:description': desc,
    'og:url': canonical,
    'og:image': image,
    'og:type': ogType,
    'twitter:title': title,
    'twitter:description': desc,
    'twitter:image': image,
  };
  for (const [prop, val] of Object.entries(ogPairs)) {
    const attr = prop.startsWith('twitter:') ? 'name' : 'property';
    const re = new RegExp(`<meta\\s+${attr}="${prop}"[^>]*>`, 'i');
    const tag = `<meta ${attr}="${prop}" content="${escapeHtml(val)}" />`;
    if (re.test(html)) html = html.replace(re, tag);
    else html = html.replace(/<\/head>/, `${tag}\n  </head>`);
  }

  // robots noindex
  if (cfg.noindex) {
    if (/<meta\s+name="robots"/i.test(html)) {
      html = html.replace(
        /<meta\s+name="robots"[^>]*>/i,
        '<meta name="robots" content="noindex,nofollow" />',
      );
    } else {
      html = html.replace(
        /<\/head>/,
        '<meta name="robots" content="noindex,nofollow" />\n  </head>',
      );
    }
  }

  // JSON-LD
  if (cfg.jsonLd) {
    const ld = `<script id="structured-data-custom" type="application/ld+json">${jsonForHtml(cfg.jsonLd)}</script>`;
    html = html.replace(/<\/head>/, `${ld}\n  </head>`);
  }

  // Contenido server-rendered dentro de #root: H1 + intro + listing.
  // React (createRoot.render) reemplazará este contenido al hidratar, pero
  // Googlebot y herramientas de IA leen el HTML inicial.
  const initial = [
    cfg.h1 ? `<h1>${escapeHtml(cfg.h1)}</h1>` : '',
    cfg.intro ? `<div data-prerender="intro">${cfg.intro}</div>` : '',
    cfg.listingHtml ? `<div data-prerender="listing">${cfg.listingHtml}</div>` : '',
  ].filter(Boolean).join('\n      ');

  if (initial) {
    // The same useful content is visible to people without JavaScript and
    // crawlers. React replaces it when the interactive application mounts.
    const navigation = '<nav aria-label="Navegación principal"><a href="/">MisAutónomos</a> · <a href="/buscar">Buscar profesionales</a> · <a href="/blog">Blog</a> · <a href="/para-autonomos">Para autónomos</a> · <a href="/tu-web">Tu web</a></nav>';
    const footer = '<footer><a href="/preguntas-frecuentes">Preguntas frecuentes</a> · <a href="/ayuda">Ayuda</a> · <a href="/privacidad">Privacidad</a> · <a href="/terminos">Términos</a> · <a href="/cookies">Cookies</a> · <a href="/aviso-legal">Aviso legal</a></footer>';
    html = html.replace('</head>', `<style id="prerender-style">.prerender-shell{max-width:1080px;margin:auto;padding:32px 24px;line-height:1.7;color:#172b4d}.prerender-shell nav,.prerender-shell footer{padding:20px 0}.prerender-shell a{color:#0057b8;text-decoration:underline}.prerender-shell h1{font-size:clamp(2rem,5vw,3.25rem);line-height:1.15;margin:28px 0}.prerender-shell h2{font-size:1.5rem;margin:28px 0 12px}.prerender-shell ul{padding-left:24px;list-style:disc}.prerender-shell p{margin:12px 0}.prerender-shell article{max-width:760px}.prerender-shell img{max-width:100%;height:auto}</style></head>`);
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/, () =>
      `<div id="root"><div data-prerender="content" class="prerender-shell">
      ${navigation}<main>${initial}</main>${footer}
    </div></div>`,
    );
  }

  return html;
}

function writeRoute(routePath, html) {
  // routePath = '/categoria/abogado' → dist/categoria/abogado/index.html
  // routePath = '/' → dist/index.html
  const rel = routePath === '/' ? 'index.html' : path.join(routePath.replace(/^\//, ''), 'index.html');
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, 'utf8');
}

// ──────────────────────────────────────────────────────────────────────────
// Generadores por tipo de ruta
// ──────────────────────────────────────────────────────────────────────────

const STATIC_ROUTES = [
  {
    path: '/tu-web',
    title: 'Tu web desde 200 € con BayenDaba | MisAutónomos',
    description: 'Una página web para tu negocio desde 200 €. Descubre qué incluye, los ejemplos de diseño y el mantenimiento opcional de BayenDaba. Solicita un presupuesto sin compromiso.',
    h1: 'Tu oficio. Tu nombre. Tu propia web.',
    intro: '<p>BayenDaba crea páginas web para profesionales de MisAutónomos. Web esencial: 200 €, una página con hasta 5 secciones, un idioma y una revisión. Web completa: 450 €, hasta 5 páginas, un idioma y dos revisiones. Mantenimiento opcional: 29 €/mes con alojamiento básico y hasta 20 minutos de cambios de contenido.</p><p>Impuestos aplicables, dominio y renovaciones se detallan en el presupuesto antes de contratar. El alojamiento se contrata aparte o dentro del mantenimiento opcional. Partimos de tus textos y fotos. Tiendas, pagos y reservas avanzadas requieren otro presupuesto. Tu ficha en MisAutónomos sigue siendo gratuita.</p><p><a href="https://bayendaba.com/es?utm_source=misautonomos&amp;utm_medium=referral&amp;utm_campaign=tu_web">Conoce BayenDaba</a> o escribe a <a href="mailto:contact@bayendaba.com">contact@bayendaba.com</a> para solicitar información sin compromiso.</p>',
  },
  {
    path: '/',
    title: 'MisAutónomos · Encuentra autónomos verificados en tu zona',
    description: 'Marketplace de autónomos y profesionales verificados en España. Contacto directo, sin comisiones, 100% gratis para clientes.',
    h1: 'Encuentra al autónomo que necesitas cerca de ti',
    intro:
      '<p>MisAutónomos te conecta directamente con autónomos verificados de toda España: electricistas, fontaneros, carpinteros, abogados, gestorías, jardineros, pintores y muchos más. Filtra por servicio y ciudad, compara perfiles con fotos reales, valoraciones verificadas y precios orientativos, y contacta al profesional por chat, WhatsApp o teléfono. Sin intermediarios y sin comisiones por trabajo.</p>',
  },
  {
    path: '/buscar',
    title: 'Buscar autónomos verificados en España | MisAutónomos',
    description: 'Filtra por servicio y zona. Compara perfiles verificados con valoraciones reales y contacta directamente. 100% gratis para clientes.',
    h1: 'Buscar autónomos por servicio y ciudad',
    intro:
      '<p>Directorio de autónomos verificados en toda España. Filtra por categoría (electricista, fontanero, carpintero, abogado…) y por provincia o ciudad. Cada perfil incluye fotos de trabajos reales, valoraciones de clientes que ya le han contactado, zona de cobertura y formas de pago aceptadas.</p>',
  },
  {
    path: '/para-autonomos',
    title: 'Hazte autónomo · Aparece en tu zona sin comisiones | MisAutónomos',
    description: 'Cómo darte de alta como autónomo en MisAutónomos. Identidad verificada, contacto directo con clientes y cero comisiones por trabajo.',
    h1: 'Aparece donde te busca tu cliente. Sin comisiones.',
    intro:
      '<p>MisAutónomos te pone delante de quien necesita tu oficio en tu zona. Validamos DNI/NIE, teléfono y oficio antes de publicar tu perfil. Los clientes te escriben directamente por chat, WhatsApp o teléfono. Sin intermediarios, sin comisiones por trabajo, sin permanencia.</p>',
  },
  {
    path: '/preguntas-frecuentes',
    title: 'Preguntas frecuentes sobre autónomos en España | MisAutónomos',
    description: 'Respuestas a las dudas más comunes sobre la cuota de autónomos, tarifa plana, IVA trimestral, facturación, contratación y uso de la plataforma.',
    h1: 'Preguntas frecuentes',
    intro: '<p>Respuestas claras a las dudas más habituales de autónomos y de clientes que buscan profesionales: cuotas, facturación, contratación, formas de pago y funcionamiento de la plataforma.</p>',
  },
  {
    path: '/ayuda',
    title: 'Centro de ayuda · Soporte | MisAutónomos',
    description: 'Soporte para clientes y autónomos registrados en MisAutónomos. Resolvemos dudas de cuenta, suscripción, perfiles y verificación.',
    h1: 'Centro de ayuda',
    intro: '<p>Si tienes alguna duda con tu cuenta, suscripción, perfil o verificación, en esta sección encontrarás respuestas paso a paso. Si no encuentras lo que buscas, puedes escribirnos.</p>',
  },
  {
    path: '/blog',
    title: 'Blog para autónomos y clientes | MisAutónomos',
    description: 'Guías prácticas, comparativas y artículos sobre alta de autónomos, facturación, contratación de profesionales y vida laboral.',
    h1: 'Blog · MisAutónomos',
    intro: '<p>Artículos prácticos para autónomos (alta, facturación, IVA, presupuestos, cobros, herramientas) y para clientes que buscan contratar profesionales con criterio.</p>',
  },
  {
    path: '/contacto',
    title: 'Contacto | MisAutónomos',
    description: 'Contacta con el equipo de MisAutónomos. Te respondemos por email en menos de 24 h en días laborables.',
    h1: 'Contacto',
    intro: '<p>Si tienes una consulta sobre la plataforma, una propuesta de colaboración o una incidencia, escríbenos y te respondemos en menos de 24 h en días laborables.</p>',
  },
  // Legales — noindex
  { path: '/privacidad', title: 'Política de privacidad | MisAutónomos', description: 'Tratamiento de datos personales en MisAutónomos.', h1: 'Política de privacidad', intro: '<p>Información sobre el tratamiento de tus datos personales, base legal, conservación y derechos del usuario.</p>' },
  { path: '/terminos', title: 'Términos y condiciones | MisAutónomos', description: 'Condiciones de uso de la plataforma MisAutónomos.', h1: 'Términos y condiciones', intro: '<p>Condiciones de uso de la plataforma para clientes y autónomos.</p>' },
  { path: '/cookies', title: 'Política de cookies | MisAutónomos', description: 'Cookies y tecnologías de seguimiento que utiliza MisAutónomos.', h1: 'Política de cookies', intro: '<p>Tipos de cookies que usa la plataforma, finalidades y cómo gestionarlas.</p>' },
  { path: '/aviso-legal', title: 'Aviso legal | MisAutónomos', description: 'Titularidad y datos del responsable del sitio MisAutónomos.', h1: 'Aviso legal', intro: '<p>Datos identificativos del responsable del sitio y información legal preceptiva.</p>' },
];

function buildStatic(tpl, route) {
  const html = renderTemplate(tpl, {
    title: route.title,
    description: route.description,
    canonical: SITE + route.path,
    image: OG_IMAGE,
    h1: route.h1,
    intro: route.intro,
    listingHtml: route.listingHtml,
  });
  writeRoute(route.path, html);
}

// Categoría: 120-200 palabras únicas por categoría + listing de profesionales reales
function buildCategoryIntro(cat, prosCount) {
  const baseDesc = (cat.description || '').trim();
  const baseExtra = baseDesc
    ? `<p>${escapeHtml(baseDesc)}</p>`
    : `<p>Encuentra ${cat.name.toLowerCase()} verificados en tu zona, con contacto directo y sin comisiones por trabajo.</p>`;
  const second =
    `<p>En MisAutónomos puedes filtrar perfiles de ${cat.name.toLowerCase()} por provincia y ciudad. Cada autónomo muestra fotos de trabajos reales, valoraciones de clientes que sí han contactado, formas de pago aceptadas y zona de cobertura. Verificamos DNI/NIE, teléfono y oficio antes de publicar el perfil.</p>`;
  const third =
    prosCount > 0
      ? `<p>Actualmente hay ${prosCount} ${prosCount === 1 ? 'profesional disponible' : 'profesionales disponibles'} en la categoría <strong>${escapeHtml(cat.name)}</strong>. Contacta directamente por chat interno, WhatsApp o teléfono — sin intermediarios.</p>`
      : `<p>Próximamente sumaremos más profesionales en la categoría <strong>${escapeHtml(cat.name)}</strong>. Si eres autónomo en este sector, puedes darte de alta gratis y aparecer en las búsquedas de tu zona.</p>`;
  return baseExtra + second + third;
}

function buildCategoryListingHtml(profs) {
  if (!profs.length) return '<p>No hay profesionales publicados en esta categoría todavía.</p>';
  const items = profs.map((p) => {
    const url = profileUrl(p);
    return `<li><a href="${escapeHtml(url)}">${escapeHtml(p.business_name || 'Profesional')}</a>${p.ciudad ? ` · ${escapeHtml(p.ciudad)}` : ''}</li>`;
  }).join('\n        ');
  return `<ul>\n        ${items}\n      </ul>`;
}

function profileUrl(p) {
  const cat = Array.isArray(p.categories) ? p.categories[0] : null;
  const nameSlug = slugify(p.slug_publico || p.business_name || '');
  if (cat && p.ciudad) {
    return `${SITE}/autonomo/${slugify(cat)}-en-${slugify(p.ciudad)}/${nameSlug}`;
  }
  return `${SITE}/autonomo/${nameSlug}`;
}

function buildCategory(tpl, cat, profs, localLinks = []) {
  const title = `${cat.name} cerca de ti · Profesionales verificados | ${SITE_NAME}`;
  const description = truncate(
    `${cat.name}: directorio de autónomos verificados en España. ${cat.description || ''} Contacto directo, sin comisiones.`,
    160,
  );
  const canonical = `${SITE}/categoria/${cat.slug}`;
  const intro = buildCategoryIntro(cat, profs.length);
  const listingHtml = buildCategoryListingHtml(profs) + (localLinks.length ? `<h2>Guías y profesionales por ciudad</h2>${linkList(localLinks)}` : '');

  const html = renderTemplate(tpl, {
    title,
    description,
    canonical,
    image: OG_IMAGE,
    h1: `${cat.name} cerca de ti`,
    intro,
    listingHtml,
  });
  writeRoute(`/categoria/${cat.slug}`, html);
}

function buildCityCategory(tpl, cat, ciudad, ciudadSlug, profs) {
  const title = `${cat.name} en ${ciudad} · Profesionales verificados | ${SITE_NAME}`;
  const description = truncate(
    `${cat.name} en ${ciudad}: ${profs.length} profesionales verificados en tu zona. Contacto directo, sin comisiones.`,
    160,
  );
  const canonical = `${SITE}/categoria/${cat.slug}/${ciudadSlug}`;
  const intro = `
    <p>${escapeHtml(cat.name)} en <strong>${escapeHtml(ciudad)}</strong>. Encuentra autónomos verificados con valoraciones reales y contacto directo, sin intermediarios.</p>
    <p>${escapeHtml(cat.description || `Profesionales de ${cat.name.toLowerCase()} listos para atender tu consulta en ${ciudad} y alrededores.`)}</p>
    <p>Actualmente ${profs.length} ${profs.length === 1 ? 'profesional disponible' : 'profesionales disponibles'} en <strong>${escapeHtml(cat.name)}</strong> dentro de <strong>${escapeHtml(ciudad)}</strong>. Compara perfiles, valoraciones y formas de pago, y contacta al que mejor se ajuste a tu trabajo.</p>
  `;
  const listingHtml = buildCategoryListingHtml(profs);

  const html = renderTemplate(tpl, {
    title,
    description,
    canonical,
    image: OG_IMAGE,
    h1: `${cat.name} en ${ciudad}`,
    intro,
    listingHtml,
  });
  writeRoute(`/categoria/${cat.slug}/${ciudadSlug}`, html);
}

// ──────────────────────────────────────────────────────────────────────────
// GUÍAS EDITORIALES LOCALES (8 páginas con allowlist)
// 4 gremios × 2 ciudades = 8. Contenido EDITORIAL único por combinación,
// NO clonado entre ciudades. Cada página tiene precios orientativos
// locales, cómo elegir, errores comunes y FAQ con FAQPage JSON-LD.
// El candado de densidad ≥ 3 NO aplica para esta allowlist porque la
// página trae valor por sí misma. Si hay pros reales se listan; si no,
// CTA honesto "¿Eres X en Y? Sé el primero".
// ──────────────────────────────────────────────────────────────────────────

// Las guías viven en `src/lib/guiasLocales.js` para que las lean también
// las páginas de React. Ver la cabecera de ese fichero: antes estaban sólo
// aquí y el navegador las borraba al hidratar.

function buildEditorialGuide(tpl, guide, cat, profs) {
  const title = `${cat.name} en ${guide.ciudad} · Precios, cómo elegir y profesionales | ${SITE_NAME}`;
  const description = truncate(
    `Guía honesta de ${cat.name.toLowerCase()} en ${guide.ciudad}: precios reales 2026, cómo elegir profesional, errores comunes y profesionales verificados de tu zona.`,
    160,
  );
  const canonical = `${SITE}/categoria/${cat.slug}/${guide.ciudadSlug}`;

  // FAQPage JSON-LD
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  // Listing real o CTA "sé el primero"
  let listingHtml;
  if (profs.length > 0) {
    listingHtml = `
      <h2>${cat.name} verificados en ${escapeHtml(guide.ciudad)}</h2>
      ${buildCategoryListingHtml(profs)}
    `;
  } else {
    listingHtml = `
      <h2>¿Eres ${escapeHtml(cat.name.toLowerCase())} en ${escapeHtml(guide.ciudad)}?</h2>
      <p>Todavía no tenemos profesionales verificados de esta categoría en ${escapeHtml(guide.ciudad)}. <strong>Sé el primero</strong>: crea tu perfil en 10 minutos, identidad verificada y sin comisiones. <a href="/para-autonomos">Hazte autónomo · Gratis →</a></p>
    `;
  }

  // FAQ visible en la página (no solo en JSON-LD)
  const faqHtml = `
    <h2>Preguntas frecuentes</h2>
    <dl>
      ${guide.faqs.map((f) => `<dt><strong>${escapeHtml(f.q)}</strong></dt><dd>${escapeHtml(f.a)}</dd>`).join('\n      ')}
    </dl>
  `;

  const html = renderTemplate(tpl, {
    title,
    description,
    canonical,
    image: OG_IMAGE,
    h1: `${cat.name} en ${guide.ciudad}: guía 2026`,
    intro: guide.intro + faqHtml,
    listingHtml,
    jsonLd: faqJsonLd,
  });
  writeRoute(`/categoria/${cat.slug}/${guide.ciudadSlug}`, html);
}

function buildProfile(tpl, p, cats) {
  const url = profileUrl(p);
  const path = url.replace(SITE, '');
  const title = `${p.business_name}${p.ciudad ? ` en ${p.ciudad}` : ''} | ${SITE_NAME}`;
  const description = truncate(p.descripcion_corta || p.description || `${p.business_name}: autónomo verificado en MisAutónomos.`, 160);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: p.business_name,
    description,
    url,
    address: p.ciudad ? {
      '@type': 'PostalAddress',
      addressLocality: p.ciudad,
      addressRegion: p.provincia || undefined,
      addressCountry: 'ES',
    } : undefined,
  };
  if (Array.isArray(p.categories) && p.categories[0]) {
    jsonLd.knowsAbout = p.categories;
  }
  if (p.total_reviews > 0 && p.average_rating > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(p.average_rating).toFixed(1),
      reviewCount: p.total_reviews,
    };
  }

  const intro = `
    <p>${escapeHtml(description)}</p>
    ${p.description && stripHtml(p.description) !== stripHtml(description) ? `<div>${safeContent(p.description)}</div>` : ''}
    ${p.ciudad ? `<p><strong>Zona:</strong> ${escapeHtml(p.ciudad)}${p.provincia && p.ciudad !== p.provincia ? `, ${escapeHtml(p.provincia)}` : ''}</p>` : ''}
    ${Array.isArray(p.categories) && p.categories[0] ? `<p><strong>Servicios:</strong> ${p.categories.map((c) => escapeHtml(c)).join(', ')}</p>` : ''}
    ${p.total_reviews > 0 ? `<p><strong>Valoración:</strong> ${Number(p.average_rating).toFixed(1)} / 5 (${p.total_reviews} reseñas)</p>` : ''}
  `;

  const html = renderTemplate(tpl, {
    title,
    description,
    canonical: url,
    image: p.imagen_principal || OG_IMAGE,
    ogType: 'profile',
    jsonLd,
    h1: p.business_name,
    intro,
    listingHtml: linkList(cats.filter((cat) => p.categories?.includes(cat.name)).map((cat) => ({ href: `/categoria/${cat.slug}`, label: cat.name }))),
  });
  writeRoute(path, html);
}

function buildBlogPost(tpl, post) {
  const title = post.meta_title_es || `${post.title_es || 'Artículo'} | ${SITE_NAME} Blog`;
  const description = truncate(post.meta_description_es || post.excerpt_es || '', 160);
  const canonical = `${SITE}/blog/${post.slug}`;
  const intro = `<p>${escapeHtml(post.excerpt_es || description)}</p><article data-prerender="article">${safeContent(post.content_es)}</article>`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title_es,
    description,
    datePublished: post.publish_date || post.updated_date,
    author: post.author_name ? { '@type': 'Person', name: post.author_name } : { '@type': 'Organization', name: SITE_NAME },
    image: post.og_image || post.featured_image || OG_IMAGE,
    mainEntityOfPage: canonical,
  };
  const html = renderTemplate(tpl, {
    title,
    description,
    canonical,
    image: post.og_image || post.featured_image || OG_IMAGE,
    ogType: 'article',
    jsonLd,
    h1: post.title_es,
    intro,
  });
  writeRoute(`/blog/${post.slug}`, html);
}

function build404(tpl) {
  const html = renderTemplate(tpl, {
    title: 'Página no encontrada (404) | MisAutónomos',
    description: 'La página solicitada no existe en MisAutónomos.',
    canonical: `${SITE}/404`,
    h1: 'Página no encontrada',
    intro: '<p>La URL que has visitado no existe o ha sido movida. Puedes volver a la <a href="/">página principal</a> o <a href="/buscar">buscar autónomos</a>.</p>',
    noindex: true,
  });
  const out = path.join(DIST, '404.html');
  fs.writeFileSync(out, html, 'utf8');
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  const tpl = loadTemplate();

  console.log('[prerender] Fetching data from Supabase…');
  const [catsRes, profsRes, postsRes] = await Promise.all([
    supabase.from('service_categories').select('slug, name, description').order('name'),
    supabase
      .from('professional_profiles')
      .select('slug_publico, business_name, descripcion_corta, description, ciudad, municipio, provincia, categories, average_rating, total_reviews, imagen_principal, slug_publico_aliases, estado_perfil, onboarding_completed')
      .eq('visible_en_busqueda', true)
      .eq('onboarding_completed', true),
    supabase
      .from('blog_posts')
      .select('slug, title_es, excerpt_es, content_es, meta_title_es, meta_description_es, publish_date, updated_date, featured_image, og_image, author_name')
      .eq('status', 'published'),
  ]);

  if (catsRes.error) throw catsRes.error;
  if (profsRes.error) throw profsRes.error;
  if (postsRes.error) throw postsRes.error;

  const cats = catsRes.data || [];
  // Excluir perfiles no-indexables (inactivo/suspendido/pendiente). estado_perfil
  // null se acepta por compatibilidad con registros antiguos.
  const profs = (profsRes.data || []).filter((p) => {
    if (!p.business_name) return false;
    return p.estado_perfil == null || p.estado_perfil === 'activo';
  });
  const posts = postsRes.data || [];

  console.log(`[prerender] Data: ${cats.length} categorías · ${profs.length} pros visibles · ${posts.length} blog posts`);

  // ── 1) Rutas estáticas
  const categoryLinks = cats.map((cat) => ({ href: `/categoria/${cat.slug}`, label: cat.name }));
  const blogLinks = posts.filter((post) => post.slug).map((post) => ({ href: `/blog/${post.slug}`, label: post.title_es }));
  let staticCount = 0;
  for (const r of STATIC_ROUTES) {
    let listingHtml = '';
    if (r.path === '/' || r.path === '/buscar') listingHtml += `<h2>Profesionales por servicio</h2>${linkList(categoryLinks)}`;
    if (r.path === '/buscar') listingHtml += `<h2>Profesionales publicados</h2>${buildCategoryListingHtml(profs)}`;
    if (r.path === '/blog') listingHtml += `<h2>Artículos publicados</h2>${linkList(blogLinks)}`;
    if (r.path === '/') listingHtml += `<h2>Del blog</h2>${linkList(blogLinks.slice(-5))}`;
    buildStatic(tpl, { ...r, listingHtml });
    staticCount++;
  }

  // ── 2) Categorías
  // Mapear nombre → slug usando service_categories.slug
  const catByName = new Map(cats.map((c) => [c.name, c]));
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));

  // Profiles por categoría (nombre → array)
  const profsByCatName = new Map();
  for (const p of profs) {
    const list = Array.isArray(p.categories) ? p.categories : [];
    for (const name of list) {
      if (!profsByCatName.has(name)) profsByCatName.set(name, []);
      profsByCatName.get(name).push(p);
    }
  }

  let categoryCount = 0;
  for (const cat of cats) {
    const list = profsByCatName.get(cat.name) || [];
    const localLinks = EDITORIAL_GUIDES.filter((guide) => guide.catSlug === cat.slug).map((guide) => ({ href: `/categoria/${cat.slug}/${guide.ciudadSlug}`, label: `${cat.name} en ${guide.ciudad}` }));
    const cities = new Map();
    for (const p of list) {
      if (!p.ciudad) continue;
      const citySlug = slugify(p.ciudad);
      const bucket = cities.get(citySlug) || { name: p.ciudad, count: 0 };
      bucket.count++;
      cities.set(citySlug, bucket);
    }
    for (const [citySlug, city] of cities) {
      const href = `/categoria/${cat.slug}/${citySlug}`;
      if (city.count >= MIN_PROS_POR_CIUDAD_CATEGORIA && !localLinks.some((link) => link.href === href)) localLinks.push({ href, label: `${cat.name} en ${city.name}` });
    }
    buildCategory(tpl, cat, list, localLinks);
    categoryCount++;
  }

  // ── 3) Profiles
  // Slug dirty detection: si el slug original tiene chars no-ASCII o guion final,
  // generamos el archivo con el slug LIMPIO y registramos el alias para 301.
  const slugRedirects = [];
  let profileCount = 0;
  for (const p of profs) {
    if (!p.business_name) continue;
    const rawSlug = p.slug_publico || slugify(p.business_name);
    const cleanSlug = slugify(rawSlug).replace(/-+$/, '');
    if (cleanSlug !== rawSlug) {
      const cleanUrl = profileUrl({ ...p, slug_publico: cleanSlug }).replace(SITE, '');
      const dirtyUrl = cleanUrl.slice(0, cleanUrl.lastIndexOf('/') + 1) + rawSlug;
      if (dirtyUrl !== cleanUrl) slugRedirects.push({ from: dirtyUrl, to: cleanUrl });
    }
    buildProfile(tpl, { ...p, slug_publico: cleanSlug }, cats);
    profileCount++;
  }

  // ── 4) Blog posts
  let blogCount = 0;
  for (const post of posts) {
    if (!post.slug) continue;
    buildBlogPost(tpl, post);
    blogCount++;
  }

  // ── 5) City × Category con candado de densidad
  // contar (catSlug, ciudadSlug) → array de profiles
  const cityCatBuckets = new Map();
  for (const p of profs) {
    const cats = Array.isArray(p.categories) ? p.categories : [];
    const ciudad = (p.ciudad || '').trim();
    if (!ciudad) continue;
    const ciudadSlug = slugify(ciudad);
    for (const catName of cats) {
      const cat = catByName.get(catName);
      if (!cat) continue;
      const key = `${cat.slug}::${ciudadSlug}`;
      if (!cityCatBuckets.has(key)) {
        cityCatBuckets.set(key, { cat, ciudad, ciudadSlug, profs: [] });
      }
      cityCatBuckets.get(key).profs.push(p);
    }
  }
  let cityCatCount = 0;
  let cityCatSkipped = 0;
  // Allowlist editorial: estas combinaciones tienen guía propia, NO se
  // generan también como city×category genéricas para evitar duplicación.
  const editorialAllowlist = new Set(
    EDITORIAL_GUIDES.map((g) => `${g.catSlug}::${g.ciudadSlug}`),
  );
  for (const { cat, ciudad, ciudadSlug, profs: list } of cityCatBuckets.values()) {
    const key = `${cat.slug}::${ciudadSlug}`;
    if (editorialAllowlist.has(key)) continue; // se construye con buildEditorialGuide
    if (list.length < MIN_PROS_POR_CIUDAD_CATEGORIA) {
      cityCatSkipped++;
      continue;
    }
    buildCityCategory(tpl, cat, ciudad, ciudadSlug, list);
    cityCatCount++;
  }

  // ── 5b) GUÍAS EDITORIALES (allowlist, sortea el candado de densidad)
  let editorialCount = 0;
  for (const guide of EDITORIAL_GUIDES) {
    const cat = catBySlug.get(guide.catSlug);
    if (!cat) {
      console.warn(`[prerender] Guía editorial: categoría '${guide.catSlug}' no existe en BD, salto`);
      continue;
    }
    // Profesionales reales de esta combinación (si los hay)
    const list = (profsByCatName.get(cat.name) || []).filter(
      (p) => p.ciudad && slugify(p.ciudad) === guide.ciudadSlug,
    );
    buildEditorialGuide(tpl, guide, cat, list);
    editorialCount++;
  }

  // ── 6) 404
  build404(tpl);

  // ── 7) Volcar redirecciones de slugs sucios a un JSON que vercel.json
  //       referenciará (lo aplicaremos como redirects 301 en build).
  const redirectsJson = path.join(DIST, 'slug-redirects.json');
  fs.writeFileSync(redirectsJson, JSON.stringify(slugRedirects, null, 2), 'utf8');

  console.log('');
  console.log('═══════════════════ Prerender summary ═══════════════════');
  console.log(`  ✓ Static:            ${staticCount}`);
  console.log(`  ✓ Categories:        ${categoryCount}`);
  console.log(`  ✓ Profiles:          ${profileCount}`);
  console.log(`  ✓ Blog posts:        ${blogCount}`);
  console.log(`  ✓ City × Category:   ${cityCatCount} (skipped ${cityCatSkipped} con < ${MIN_PROS_POR_CIUDAD_CATEGORIA} pros)`);
  console.log(`  ✓ Editorial guides:  ${editorialCount}`);
  console.log(`  ✓ 404 page:          1`);
  console.log(`  ✓ Slug redirects:    ${slugRedirects.length}`);
  console.log('═════════════════════════════════════════════════════════');
  const total = staticCount + categoryCount + profileCount + blogCount + cityCatCount + editorialCount + 1;
  console.log(`  Total HTML files:    ${total}`);
}

main().catch((e) => {
  console.error('[prerender] FAIL', e);
  process.exit(1);
});
