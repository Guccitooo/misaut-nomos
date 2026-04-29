/**
 * Resuelve slugs legacy/sucios → paths canónicos limpios.
 * Llamar desde el frontend antes de mostrar 404.
 *
 * POST body: { path: "/categoria/albanil-reformasss-en-getafe" }
 * Respuesta: { canonical: "/categoria/albanil-reformas-en-getafe", found: true }
 *            { canonical: null, found: false }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Misma función que en el frontend
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalize(text) {
  if (!text) return '';
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Limpia un slug sucio: quita duplicaciones de letras finales repetidas,
 * normaliza, colapsa guiones.
 * "albanil-reformasss" → "albanil-reformas"
 * "electricistass"     → "electricista" (no, conservamos la raíz)
 */
function cleanDirtySlug(slug) {
  if (!slug) return '';
  // Quitar guiones finales/iniciales y guiones múltiples
  let clean = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
  // Quitar duplicación de s al final de cada segmento (reformasss → reformas)
  clean = clean.replace(/([a-z])\1{1,}/g, '$1'); // colapsa letras repetidas consecutivas
  // Re-normalizar
  clean = slugify(clean);
  return clean;
}

/**
 * Busca la ServiceCategory cuyo slug se aproxima más al slug dado.
 * Estrategias en orden:
 * 1. Coincidencia exacta (ya debería estar resuelta antes de llamar aquí)
 * 2. Normalización: quitar letras duplicadas finales
 * 3. Match por prefijo (el slug viejo empieza por el slug correcto)
 * 4. Match por distancia de edición baja (≤2 chars)
 */
function findBestCategoryMatch(categories, dirtySlug) {
  const norm = normalize(dirtySlug);

  // 1. Exacto
  let found = categories.find(c => c.slug === dirtySlug || normalize(c.slug) === norm);
  if (found) return found;

  // 2. Limpiado (quitar letras duplicadas)
  const cleaned = cleanDirtySlug(dirtySlug);
  found = categories.find(c => c.slug === cleaned || normalize(c.slug) === normalize(cleaned));
  if (found) return found;

  // 3. Slugify del name
  found = categories.find(c => normalize(slugify(c.name)) === norm || normalize(slugify(c.name)) === normalize(cleaned));
  if (found) return found;

  // 4. Prefijo: el slug correcto es prefijo del slug sucio (ej. "albanil-reformas" ⊂ "albanil-reformasss")
  found = categories.find(c => {
    const cs = normalize(c.slug || slugify(c.name));
    return norm.startsWith(cs) && norm.length - cs.length <= 3;
  });
  if (found) return found;

  // 5. El slug sucio es prefijo del slug correcto (truncado)
  found = categories.find(c => {
    const cs = normalize(c.slug || slugify(c.name));
    return cs.startsWith(norm) && cs.length - norm.length <= 3;
  });
  return found || null;
}

/**
 * Busca el ProfessionalProfile cuyo slug_publico o slug_publico_aliases
 * coincide con el slug sucio dado.
 */
function findBestProfileMatch(profiles, dirtySlug) {
  const norm = normalize(dirtySlug);
  const cleaned = cleanDirtySlug(dirtySlug);
  const normCleaned = normalize(cleaned);

  // 1. Exacto
  let found = profiles.find(p => p.slug_publico === dirtySlug);
  if (found) return found;

  // 2. Aliases guardados
  found = profiles.find(p => p.slug_publico_aliases?.includes(dirtySlug));
  if (found) return found;

  // 3. Slug limpio
  found = profiles.find(p => p.slug_publico === cleaned || normalize(p.slug_publico) === normCleaned);
  if (found) return found;

  // 4. Alias normalizado
  found = profiles.find(p =>
    p.slug_publico_aliases?.some(a => normalize(a) === norm || normalize(a) === normCleaned)
  );
  if (found) return found;

  // 5. Match por nombre slugificado
  found = profiles.find(p => normalize(slugify(p.business_name || '')) === normCleaned);
  return found || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { path } = await req.json();

    if (!path || typeof path !== 'string') {
      return Response.json({ found: false, canonical: null });
    }

    // Parsear el path
    const isCategoryPath = path.startsWith('/categoria/');
    const isProfilePath = path.startsWith('/autonomo/');

    if (!isCategoryPath && !isProfilePath) {
      return Response.json({ found: false, canonical: null });
    }

    let canonical = null;
    let redirectType = null;

    if (isCategoryPath) {
      redirectType = 'category';
      // Extraer el segmento de la URL: /categoria/SEGMENTO
      const segment = path.replace('/categoria/', '').split('?')[0];

      let catSlug = segment;
      let ciudadSlug = null;

      if (segment.includes('-en-')) {
        const enIdx = segment.indexOf('-en-');
        catSlug = segment.slice(0, enIdx);
        ciudadSlug = segment.slice(enIdx + 4);
      }

      const categories = await base44.asServiceRole.entities.ServiceCategory.list();
      const match = findBestCategoryMatch(categories, catSlug);

      if (match) {
        const correctCatSlug = match.slug || slugify(match.name);
        // Solo redirigir si el slug es diferente al actual
        if (correctCatSlug !== catSlug) {
          canonical = ciudadSlug
            ? `/categoria/${correctCatSlug}-en-${ciudadSlug}`
            : `/categoria/${correctCatSlug}`;
        }
      }
    }

    if (isProfilePath) {
      redirectType = 'profile';
      // Extraer el slug: /autonomo/SLUG o /autonomo/cat-en-ciudad/SLUG
      const parts = path.replace('/autonomo/', '').split('/').filter(Boolean);
      const profileSlug = parts[parts.length - 1]; // el último segmento es siempre el slug del perfil

      const profiles = await base44.asServiceRole.entities.ProfessionalProfile.filter({
        visible_en_busqueda: true
      });

      const match = findBestProfileMatch(profiles, profileSlug);
      if (match && match.slug_publico && match.slug_publico !== profileSlug) {
        canonical = `/autonomo/${match.slug_publico}`;
      }
    }

    // Si encontramos canonical, loguear el redirect
    if (canonical) {
      const userAgent = req.headers.get('user-agent') || '';
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      // Fire-and-forget logging
      base44.asServiceRole.entities.RedirectLog.create({
        from_path: path,
        to_path: canonical,
        redirect_type: redirectType,
        user_agent: userAgent.slice(0, 200),
        expires_at: expiresAt
      }).catch(() => {});

      return Response.json({ found: true, canonical });
    }

    return Response.json({ found: false, canonical: null });

  } catch (error) {
    return Response.json({ error: error.message, found: false, canonical: null }, { status: 500 });
  }
});