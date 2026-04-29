/**
 * Determina qué nombre mostrar para el remitente en emails y notificaciones
 * Anonimiza nombres reales del admin según el tipo de conversación
 * 
 * @param {Object} sender - Objeto del usuario que envía el mensaje
 * @param {string} sender.id - ID del usuario
 * @param {string} sender.full_name - Nombre real del usuario
 * @param {boolean} sender.is_admin - Si es administrador
 * @param {string} sender.role - Rol del usuario
 * @param {string} chatCategory - Categoría del chat ('ads_briefing', 'support', 'client', 'professional')
 * @returns {string} Nombre a mostrar en emails/notificaciones
 */
export function getSenderDisplayName(sender, chatCategory = 'client') {
  // Si no hay sender, usar genérico
  if (!sender) {
    return 'Un usuario';
  }

  // Si es admin (role === 'admin' o is_admin === true)
  const isAdmin = sender.role === 'admin' || sender.is_admin === true;
  
  if (isAdmin) {
    // Admin → mostrar nombre genérico según tipo de chat
    switch (chatCategory?.toLowerCase()) {
      case 'ads_briefing':
      case 'briefing':
        return 'Equipo Plan Ads+';
      case 'support':
        return 'Equipo MisAutónomos';
      case 'client':
      case 'professional':
      default:
        return 'Equipo MisAutónomos';
    }
  }

  // Si no es admin → mostrar nombre real (cliente o profesional)
  return sender.full_name || 'Un usuario';
}

/**
 * Resuelve el nombre del remitente desde ID (fetch + determina nombre)
 * Úsalo cuando solo tienes el sender_id
 * 
 * @param {Object} base44 - Cliente SDK de Base44
 * @param {string} senderId - ID del remitente
 * @param {string} chatCategory - Categoría del chat
 * @returns {Promise<string>} Nombre a mostrar
 */
export async function getSenderDisplayNameFromId(base44, senderId, chatCategory = 'client') {
  if (!senderId) return 'Un usuario';
  
  try {
    const senders = await base44.asServiceRole.entities.User.filter({
      id: senderId
    });
    const sender = senders?.[0];
    return getSenderDisplayName(sender, chatCategory);
  } catch (e) {
    console.warn('Failed to resolve sender name:', e.message);
    return 'Un usuario';
  }
}