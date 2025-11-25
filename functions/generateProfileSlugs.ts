import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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
      // Saltar si ya tiene slug
      if (profile.slug_publico) {
        skipped++;
        continue;
      }
      
      // Generar slug base
      let baseSlug = slugify(profile.business_name);
      
      // Añadir categoría si es corto o genérico
      if (baseSlug.length < 5 || profile.categories?.length > 0) {
        const categorySlug = slugify(profile.categories?.[0] || '');
        if (categorySlug && !baseSlug.includes(categorySlug)) {
          baseSlug = `${baseSlug}-${categorySlug}`;
        }
      }
      
      // Generar slug único
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
        slug: uniqueSlug
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