import { base44 } from '@/api/base44Client';

/**
 * Envía una push notification vía OneSignal (a través de función backend).
 * Silencia errores para no bloquear acciones del usuario.
 */
export const sendPush = async ({ userIds, title, message, url, data = {} }) => {
  try {
    const response = await base44.functions.invoke('sendPushNotification', {
      userIds: Array.isArray(userIds) ? userIds : [userIds],
      title,
      message,
      url,
      data,
    });
    return response.data;
  } catch (err) {
    console.error('sendPush error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Crea una notificación en BD Y envía push simultáneamente.
 * El push falla silenciosamente; la notificación en BD siempre se crea.
 */
export const notifyUser = async ({ userId, type, title, message, url, data = {} }) => {
  // 1. Crear notificación en BD (siempre)
  base44.entities.Notification.create({
    user_id: userId,
    type,
    title,
    message,
    link: url || '',
    is_read: false,
    priority: 'medium',
    metadata: data,
  }).catch(e => console.error('Notification create error:', e));

  // 2. Enviar push (silencioso si falla)
  sendPush({ userIds: [userId], title, message, url, data }).catch(e => console.error('Push error:', e));
};

// ─── Templates ────────────────────────────────────────────────────────────────

export const pushTemplates = {
  newMessage: (senderName, preview) => ({
    title: `💬 Nuevo mensaje de ${senderName}`,
    message: preview?.length > 80 ? preview.slice(0, 80) + '...' : (preview || 'Te han enviado un mensaje'),
    url: 'https://misautonomos.es/mensajes',
  }),

  newQuoteRequest: (clientName, description) => ({
    title: `📋 Nueva solicitud de presupuesto`,
    message: `${clientName} necesita: ${description?.slice(0, 80) || 'presupuesto'}`,
    url: 'https://misautonomos.es/mensajes',
  }),

  quoteAccepted: (clientName, title) => ({
    title: `✅ Presupuesto aceptado`,
    message: `${clientName} ha aceptado tu presupuesto`,
    url: 'https://misautonomos.es/mensajes',
  }),

  quoteRejected: (clientName) => ({
    title: `❌ Presupuesto rechazado`,
    message: `${clientName} no ha aceptado tu presupuesto`,
    url: 'https://misautonomos.es/mensajes',
  }),

  newReview: (clientName, rating) => ({
    title: `⭐ Nueva reseña de ${clientName}`,
    message: `Te ha valorado con ${rating} estrellas`,
    url: 'https://misautonomos.es/mi-perfil',
  }),

  subscriptionExpiring: (daysLeft) => ({
    title: `⏰ Tu suscripción expira en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`,
    message: 'Renueva para seguir recibiendo clientes',
    url: 'https://misautonomos.es/suscripcion',
  }),
};