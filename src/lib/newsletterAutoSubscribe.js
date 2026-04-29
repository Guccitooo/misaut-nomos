import { base44 } from "@/api/base44Client";
import { notifyAdminEvent } from "./notifyAdmin";

/**
 * Suscribe a un usuario al newsletter automáticamente.
 * Idempotente: si ya existe un NewsletterSubscriber con ese email, NO hace nada.
 */
export async function autoSubscribeToNewsletter({
  email,
  name = '',
  userTypeInterest = 'ambos',
  source = 'auto_signup',
  extraTags = []
}) {
  if (!email) return;
  try {
    const existing = await base44.entities.NewsletterSubscriber.filter({ email });
    if (existing && existing.length > 0) {
      return;
    }
    await base44.entities.NewsletterSubscriber.create({
      email,
      name: name || '',
      source,
      status: 'confirmed',
      language: 'es',
      user_type_interest: userTypeInterest,
      tags: ['auto_subscribed', ...extraTags],
      confirmation_token: 'auto_' + Math.random().toString(36).substring(2, 14),
      confirmed_at: new Date().toISOString(),
      unsubscribe_token: 'unsub_' + Math.random().toString(36).substring(2, 16),
    });
    notifyAdminEvent({
      event: 'newsletter_signup',
      title: '📧 Nuevo suscriptor newsletter',
      body: `<strong>${name || email}</strong> se ha suscrito como <em>${userTypeInterest}</em>.`,
      data: { email, name, userTypeInterest, source },
      userEmail: email
    });
  } catch (err) {
    // Silencioso: no rompe el flujo de registro
    console.error('⚠️ Error al auto-suscribir al newsletter:', err);
  }
}