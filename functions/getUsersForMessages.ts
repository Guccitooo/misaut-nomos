import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();
    const { user_ids } = data || {};

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return Response.json({ error: 'user_ids array required' }, { status: 400 });
    }

    console.log(`📨 Cargando ${user_ids.length} usuarios para mensajes`);

    // Usar service role para obtener datos de usuarios (necesario para mensajería)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const allProfiles = await base44.asServiceRole.entities.ProfessionalProfile.list();
    
    const usersData = {};
    
    for (const userId of user_ids) {
      const userData = allUsers.find(u => u.id === userId);
      if (!userData) continue;
      
      // Datos públicos seguros (sin info sensible)
      const safeUserData = {
        id: userData.id,
        full_name: userData.full_name || null,
        email: userData.email,
        user_type: userData.user_type,
        profile_picture: userData.profile_picture || null
      };
      
      // Si es profesional, incluir datos del perfil
      if (userData.user_type === "professionnel") {
        const profile = allProfiles.find(p => p.user_id === userId);
        if (profile) {
          safeUserData.profile = {
            business_name: profile.business_name || null,
            imagen_principal: profile.imagen_principal || null,
            telefono_contacto: profile.telefono_contacto || null,
            categories: profile.categories || []
          };
        }
      }
      
      usersData[userId] = safeUserData;
    }

    return Response.json({ 
      ok: true,
      users: usersData,
      count: Object.keys(usersData).length
    });

  } catch (error) {
    console.error('❌ Error loading users:', error);
    return Response.json({ 
      error: error.message,
      ok: false
    }, { status: 500 });
  }
});