import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Función para generar slug limpio sin acentos ni caracteres raros
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
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales por guiones
    .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio y final
    .replace(/-+/g, '-'); // Eliminar guiones duplicados
}

// Generar slug único: juan-perez, juan-perez-2, juan-perez-3...
function generateUniqueSlug(baseSlug, existingSlugs) {
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar que es admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Solo administradores pueden ejecutar esta función' }, { status: 403 });
    }
    
    // Obtener todos los perfiles
    const profiles = await base44.asServiceRole.entities.ProfessionalProfile.list();
    
    // Mapeo de slugs antiguos a nuevos para redirecciones
    const redirections = [];
    const existingNewSlugs = [];
    
    let updated = 0;
    let skipped = 0;
    const results = [];
    
    // Primera pasada: generar nuevos slugs limpios
    for (const profile of profiles) {
      const oldSlug = profile.slug_publico;
      
      // Generar slug limpio solo del nombre (sin ID aleatorio ni categoría)
      const newBaseSlug = slugify(profile.business_name);
      
      // Verificar si el slug ya es limpio
      const isCleanSlug = oldSlug && 
        oldSlug === newBaseSlug && 
        !oldSlug.match(/-[a-f0-9]{6,}$/i); // No tiene ID hexadecimal al final
      
      if (isCleanSlug) {
        existingNewSlugs.push(oldSlug);
        skipped++;
        continue;
      }
      
      // Generar slug único
      const newSlug = generateUniqueSlug(newBaseSlug, existingNewSlugs);
      existingNewSlugs.push(newSlug);
      
      // Guardar redirección si había slug antiguo diferente
      if (oldSlug && oldSlug !== newSlug) {
        redirections.push({
          old_slug: oldSlug,
          new_slug: newSlug,
          profile_id: profile.id,
          business_name: profile.business_name
        });
      }
      
      // Actualizar perfil con nuevo slug
      await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
        slug_publico: newSlug
      });
      
      updated++;
      results.push({
        id: profile.id,
        business_name: profile.business_name,
        old_slug: oldSlug || '(ninguno)',
        new_slug: newSlug
      });
    }
    
    return Response.json({
      success: true,
      message: `Migración completada: ${updated} actualizados, ${skipped} ya estaban limpios`,
      updated,
      skipped,
      redirections,
      results
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});