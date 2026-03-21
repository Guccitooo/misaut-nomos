import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Generar slug limpio: sin acentos, sin IDs aleatorios
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
    
    // Recopilar slugs existentes
    const existingSlugs = profiles
      .filter(p => p.slug_publico)
      .map(p => p.slug_publico);
    
    let updated = 0;
    let skipped = 0;
    const results = [];
    
    for (const profile of profiles) {
      // Generar slug base SOLO del nombre (sin categoría, sin IDs)
      const baseSlug = slugify(profile.business_name);
      
      // Verificar si ya tiene un slug limpio válido
      const currentSlug = profile.slug_publico;
      const isAlreadyClean = currentSlug && 
        currentSlug === baseSlug && 
        !currentSlug.match(/-[a-f0-9]{6,}$/i); // No tiene ID hexadecimal
      
      if (isAlreadyClean) {
        existingSlugs.push(currentSlug);
        skipped++;
        continue;
      }
      
      // Generar slug único (juan-perez, juan-perez-2, etc.)
      const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
      existingSlugs.push(uniqueSlug);
      
      // Actualizar perfil
      await base44.asServiceRole.entities.ProfessionalProfile.update(profile.id, {
        slug_publico: uniqueSlug
      });
      
      updated++;
      results.push({
        id: profile.id,
        business_name: profile.business_name,
        old_slug: currentSlug || '(ninguno)',
        new_slug: uniqueSlug
      });
    }
    
    return Response.json({
      success: true,
      message: `Slugs generados: ${updated} actualizados, ${skipped} ya tenían slug`,
      updated,
      skipped,
      results
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});