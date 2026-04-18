import { base44 } from '@/api/base44Client';
import { SUPPORT_USER_ID, SUPPORT_WELCOME_MESSAGE, SUPPORT_DISPLAY_NAME } from '@/config/support';

/**
 * Abre el chat de soporte o lo crea si es la primera vez
 */
export async function openSupportChat(currentUser, navigate) {
  if (!currentUser) {
    base44.auth.redirectToLogin();
    return;
  }

  // Generar conversation_id consistente (ordenados por id)
  const ids = [currentUser.id, SUPPORT_USER_ID].sort();
  const conversationId = `${ids[0]}_${ids[1]}`;

  try {
    // Verificar si ya existe conversación
    const existing = await base44.entities.Message.filter(
      { conversation_id: conversationId },
      '-created_date',
      1
    );

    if (existing.length === 0) {
      // Primera vez — crear mensaje de bienvenida de soporte
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: SUPPORT_USER_ID,
        recipient_id: currentUser.id,
        content: SUPPORT_WELCOME_MESSAGE,
        professional_name: SUPPORT_DISPLAY_NAME,
        client_name: currentUser.full_name || currentUser.email,
        is_read: false,
        attachments: [],
      });
    }

    // Navegar al chat
    navigate(`/mensajes?conv=${conversationId}`);
  } catch (error) {
    console.error('Error abriendo chat de soporte:', error);
  }
}

/**
 * Obtiene el ID de conversación de soporte para un usuario
 */
export function getSupportConversationId(userId) {
  const ids = [userId, SUPPORT_USER_ID].sort();
  return `${ids[0]}_${ids[1]}`;
}

/**
 * Verifica si una conversación es de soporte
 */
export function isSupportConversation(conversationId) {
  return conversationId.includes(SUPPORT_USER_ID);
}