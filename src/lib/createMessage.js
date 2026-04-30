import { base44 } from '@/api/base44Client';

/**
 * Resuelve el sender_name correcto según el sender y el tipo de conversación.
 * - Admin en briefing_* → "Equipo Plan Ads+"
 * - Admin en support_* u otros → "Equipo MisAutónomos"
 * - support_team (ID virtual) → nombre según conversación
 * - Profesional → business_name o full_name
 * - Cliente → full_name
 */
export async function resolveSenderName(senderId, conversationId = '', fallbackName = '') {
  // sender_id virtual del equipo de soporte
  if (senderId === 'support_team') {
    return conversationId?.startsWith('briefing_') ? 'Equipo Plan Ads+' : 'Equipo MisAutónomos';
  }

  if (!senderId) return fallbackName || 'Equipo MisAutónomos';

  try {
    // Verificar si es admin
    const users = await base44.entities.User.filter({ id: senderId });
    const user = users?.[0];

    if (user?.role === 'admin') {
      return conversationId?.startsWith('briefing_') ? 'Equipo Plan Ads+' : 'Equipo MisAutónomos';
    }

    // No es admin → resolver nombre real
    if (user) {
      // Intentar business_name del perfil profesional primero
      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: senderId });
      if (profiles?.[0]?.business_name) return profiles[0].business_name;
      if (user.full_name) return user.full_name;
    }
  } catch (err) {
    console.warn('resolveSenderName failed:', err);
  }

  return fallbackName || 'Equipo MisAutónomos';
}

/**
 * Crea un Message asegurando que sender_name esté siempre poblado.
 * Única forma recomendada de crear mensajes en el frontend.
 */
export async function createMessage(messageData) {
  let senderName = messageData.sender_name;
  if (!senderName) {
    senderName = await resolveSenderName(
      messageData.sender_id,
      messageData.conversation_id || '',
      ''
    );
  }
  return await base44.entities.Message.create({
    ...messageData,
    sender_name: senderName || 'Equipo MisAutónomos',
  });
}