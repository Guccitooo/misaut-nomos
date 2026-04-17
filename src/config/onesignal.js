/*
 * CONFIGURACIÓN DE ONESIGNAL
 *
 * 1. Crear cuenta en https://onesignal.com (gratis hasta 10.000 suscriptores)
 * 2. Crear nueva app → tipo "Web Push"
 * 3. Configurar:
 *    - Site Name: MisAutónomos
 *    - Site URL: https://misautonomos.es
 *    - Subir icono del logo
 * 4. Copiar el App ID de Settings > Keys & IDs
 * 5. Pegarlo en ONESIGNAL_APP_ID abajo
 * 6. Descargar OneSignalSDKWorker.js desde el panel y subirlo a /public
 *    (o usar la versión CDN que ya está puesta)
 *
 * ENVIAR NOTIFICACIONES:
 * - Manualmente desde el dashboard de OneSignal (Messages > New Push)
 * - Segmentar por tags: user_type=professionnel, has_subscription=yes, etc.
 * - Para envío automático desde eventos de la app, se necesita integración
 *   con la API REST de OneSignal + una función backend (segunda fase)
 */

// Reemplazar YOUR_ONESIGNAL_APP_ID con el App ID real de OneSignal
// Obtenible en: https://dashboard.onesignal.com > Settings > Keys & IDs
export const ONESIGNAL_APP_ID = 'e178adb2-38e8-4397-9239-833be611ed27';

// Eventos que disparan notificaciones
export const NOTIFICATION_EVENTS = {
  NEW_MESSAGE: 'new_message',
  NEW_QUOTE_REQUEST: 'new_quote_request',
  QUOTE_ACCEPTED: 'quote_accepted',
  QUOTE_REJECTED: 'quote_rejected',
  NEW_REVIEW: 'new_review',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring'
};