// Utilidades para generar URLs SEO-friendly

/**
 * Normaliza un texto a formato slug
 * - Convierte a minúsculas
 * - Reemplaza espacios y caracteres especiales por guiones
 * - Elimina acentos
 * - Elimina caracteres no alfanuméricos
 */
export function slugify(text) {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Normalizar caracteres acentuados
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplazar ñ por n
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'n')
    // Reemplazar espacios y caracteres especiales por guiones
    .replace(/[^a-z0-9]+/g, '-')
    // Eliminar guiones al inicio y final
    .replace(/^-+|-+$/g, '')
    // Eliminar guiones duplicados
    .replace(/-+/g, '-');
}

/**
 * Genera un slug único para un profesional
 */
export function generateProfessionalSlug(businessName, category) {
  const nameSlug = slugify(businessName);
  const categorySlug = category ? slugify(category) : '';
  
  if (categorySlug && !nameSlug.includes(categorySlug)) {
    return `${nameSlug}-${categorySlug}`;
  }
  
  return nameSlug;
}

/**
 * Genera la URL para una categoría
 */
export function getCategoryUrl(categoryName) {
  const slug = slugify(categoryName);
  // Pluralizar categorías simples
  const pluralMap = {
    'electricista': 'electricistas',
    'fontanero': 'fontaneros',
    'carpintero': 'carpinteros',
    'pintor': 'pintores',
    'jardinero': 'jardineros',
    'transportista': 'transportistas',
    'cerrajero': 'cerrajeros',
  };
  
  return `/${pluralMap[slug] || slug}`;
}

/**
 * Genera la URL para categoría + ciudad
 */
export function getCategoryLocationUrl(categoryName, ciudad) {
  const categorySlug = slugify(categoryName);
  const ciudadSlug = slugify(ciudad);
  
  const pluralMap = {
    'electricista': 'electricistas',
    'fontanero': 'fontaneros',
    'carpintero': 'carpinteros',
    'pintor': 'pintores',
    'jardinero': 'jardineros',
    'transportista': 'transportistas',
    'cerrajero': 'cerrajeros',
  };
  
  const categoryUrl = pluralMap[categorySlug] || categorySlug;
  
  return `/${categoryUrl}/${ciudadSlug}`;
}

/**
 * Genera la URL para un perfil de profesional
 */
export function getProfessionalUrl(profile) {
  if (profile.slug_publico) {
    return `/autonomo/${profile.slug_publico}`;
  }
  
  const slug = generateProfessionalSlug(
    profile.business_name,
    profile.categories?.[0]
  );
  
  return `/autonomo/${slug}`;
}

/**
 * Extrae la categoría desde un slug de URL
 */
export function categoryFromSlug(slug) {
  const singularMap = {
    'electricistas': 'Electricista',
    'fontaneros': 'Fontanero',
    'carpinteros': 'Carpintero',
    'pintores': 'Pintor',
    'jardineros': 'Jardinero',
    'transportistas': 'Transportista',
    'cerrajeros': 'Cerrajero',
    'albanil-reformas': 'Albañil / Reformas',
    'autonomo-de-limpieza': 'Autónomo de limpieza',
    'instalador-de-aire-acondicionado': 'Instalador de aire acondicionado',
    'mantenimiento-general': 'Mantenimiento general',
    'mantenimiento-de-piscinas': 'Mantenimiento de piscinas',
    'asesoria-o-gestoria': 'Asesoría o gestoría',
    'empresa-multiservicios': 'Empresa multiservicios',
  };
  
  return singularMap[slug] || null;
}

/**
 * Extrae la ciudad desde un slug de URL
 */
export function cityFromSlug(slug) {
  // Capitalizar cada palabra
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Verifica si un slug ya existe y genera uno único
 */
export function generateUniqueSlug(baseSlug, existingSlugs) {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 2;
  let newSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(newSlug)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }
  
  return newSlug;
}