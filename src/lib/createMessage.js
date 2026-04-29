import { base44 } from '@/api/base44Client';

/**
 * Resuelve el nombre real de un usuario por su ID.
 * Prioriza ProfessionalProfile.business_name si existe.
 */
async function resolveSenderName(senderId, fallbackName = '') {
  if (!senderId) return fallbackName || 'Usuario';
  try {
    const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: senderId });
    if (profiles?.[0]?.business_name) return profiles[0].business_name;
    const users = await base44.entities.User.filter({ id: senderId });
    if (users?.[0]?.full_name) return users[0].full_name;
  } catch (err) {
    console.warn('resolveSenderName failed:', err);
  }
  return fallbackName || 'Usuario';
}

/**
 * Crea un Message asegurando que sender_name esté correctamente poblado.
 * Única forma recomendada de crear mensajes en el frontend.
 */
export async function createMessage(messageData) {
  let senderName = messageData.sender_name;
  if (!senderName) {
    senderName = await resolveSenderName(messageData.sender_id, '');
  }
  return await base44.entities.Message.create({
    ...messageData,
    sender_name: senderName,
  });
}