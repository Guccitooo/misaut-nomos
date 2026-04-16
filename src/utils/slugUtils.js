/**
 * Genera un slug limpio y URL-safe a partir de un texto
 * - Convierte a minúsculas
 * - Elimina tildes (á→a, é→e, ñ→n, etc.)
 * - Reemplaza espacios con guiones
 * - Elimina caracteres especiales
 * - Limpia guiones múltiples
 */
export const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')    // solo letras, números, espacios, guiones
    .trim()
    .replace(/\s+/g, '-')            // espacios a guiones
    .replace(/-+/g, '-')             // guiones múltiples a uno solo
    .replace(/^-|-$/g, '');          // quitar guiones al inicio/fin
};

/**
 * Verifica si un slug necesita limpieza (tiene caracteres sucios)
 */
export const isSlugDirty = (slug) => {
  if (!slug) return true;
  // Si contiene tildes, espacios, guiones múltiples, o es diferente al slug generado
  return /[áéíóúñçÁÉÍÓÚÑÇ\s]|--/.test(slug) || slug !== generateSlug(slug);
};

/**
 * Asegura que el slug sea único por contexto
 * Si el slug ya existe en otro perfil, añade el municipio o número
 */
export const ensureUniqueSlug = async (baseSlug, existingSlugs = []) => {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  // Si ya existe, añadir sufijos progresivos
  for (let i = 2; i <= 10; i++) {
    const newSlug = `${baseSlug}-${i}`;
    if (!existingSlugs.includes(newSlug)) {
      return newSlug;
    }
  }
  return baseSlug; // fallback
};