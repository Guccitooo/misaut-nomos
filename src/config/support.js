// Configuración del sistema de soporte
export const SUPPORT_USER_ID = '690076ad86e673c796768de7';
export const SUPPORT_USER_EMAIL = 'bigseo.online.com@gmail.com';
export const SUPPORT_DISPLAY_NAME = 'Soporte MisAutónomos';
export const SUPPORT_AVATAR_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png';
export const SUPPORT_WELCOME_MESSAGE = '👋 Hola, soy el equipo de Soporte de MisAutónomos. Estamos aquí para ayudarte con cualquier duda. ¿En qué te podemos ayudar?';

export const isSupportUser = (userId) => userId === SUPPORT_USER_ID;
export const isSupportConversation = (conversationId, userId) => {
  return conversationId.includes(SUPPORT_USER_ID);
};