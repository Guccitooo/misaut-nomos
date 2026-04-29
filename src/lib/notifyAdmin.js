import { base44 } from '@/api/base44Client';

const ADMIN_EMAIL = 'bigseo.online.com@gmail.com';

/**
 * Notifica al admin por email de un evento. Fire-and-forget.
 * No bloquea ni rompe el flujo si falla.
 * Ignora acciones del propio admin para evitar spam de testing.
 */
export function notifyAdminEvent({ event, title, body = '', data = null, severity = 'low', userEmail = null }) {
  // No notificar si el actor es el propio admin
  if (userEmail === ADMIN_EMAIL) return;

  base44.functions.invoke('notifyAdmin', { event, title, body, data, severity })
    .catch(err => console.warn('notifyAdmin failed:', err));
}