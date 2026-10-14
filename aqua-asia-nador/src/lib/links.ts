import { visible, telHref } from './data';

/**
 * Cible du bouton « Réserver » : le téléphone, et seulement lui.
 * Sans numéro affichable (mode launch tant qu'il n'est pas confirmé), il n'existe aucun moyen
 * réel de réserver : la fonction renvoie `null` et les composants n'affichent PAS le bouton
 * (pas de formulaire, pas de widget, pas de WhatsApp, pas de bouton vers une page sans réservation).
 *
 * `phone` sert au texte réservé aux lecteurs d'écran ajouté APRÈS le libellé visible
 * (le nom accessible commence toujours par les mots affichés — WCAG 2.5.3).
 */
export function reserveTarget() {
  if (!visible.phone) return null;
  return { href: telHref(visible.phone), phone: visible.phone.display };
}
