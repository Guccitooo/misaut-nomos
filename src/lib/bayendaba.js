export const BAYENDABA_WHATSAPP = '34644853733';
export const BAYENDABA_EMAIL = 'contact@bayendaba.com';
export const WEB_PLANS = Object.freeze({ essential: 200, complete: 450 });
export const MAINTENANCE_PRICE = 29;

const SOURCES = new Set(['dashboard', 'para-autonomos', 'footer', 'nav', 'direct']);
export function offerSource(value) {
  return SOURCES.has(value) ? value : 'direct';
}

export function offerPath(source = 'direct') {
  return `/tu-web?origen=${offerSource(source)}`;
}

const clean = (value, max) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

// Contact data only enters an external URL after the visitor prepares and
// opens their request. Nothing is submitted to a database or mailing list.
export function buildWebRequest({ business, activity, details, plan, maintenance, source, language = 'es' }) {
  const chosen = Object.hasOwn(WEB_PLANS, plan) ? plan : 'essential';
  const english = language.startsWith('en');
  const name = clean(business, 100);
  const service = clean(activity, 100);
  const note = clean(details, 500);
  const ref = `MA-WEB / ${offerSource(source)} / ${chosen}`;
  const lines = english ? [
    'Hello BayenDaba! I found your website offer on MisAutónomos.',
    `I am interested in: ${chosen === 'essential' ? 'Essential website' : 'Complete website'} — €${WEB_PLANS[chosen]} before applicable taxes.`,
    `Business: ${name}`, `Activity: ${service}`,
    ...(note ? [`My project: ${note}`] : []),
    ...(maintenance ? [`I would also like information about optional maintenance (€${MAINTENANCE_PRICE}/month).`] : []),
    'Please confirm the scope, domain, hosting, taxes, renewals and delivery date in a written quote before starting.',
    `Reference: ${ref}`,
  ] : [
    '¡Hola BayenDaba! He visto vuestra oferta de páginas web en MisAutónomos.',
    `Me interesa: ${chosen === 'essential' ? 'Web esencial' : 'Web completa'} — ${WEB_PLANS[chosen]} € antes de los impuestos que correspondan.`,
    `Negocio: ${name}`, `Actividad: ${service}`,
    ...(note ? [`Mi proyecto: ${note}`] : []),
    ...(maintenance ? [`También quiero información del mantenimiento opcional (${MAINTENANCE_PRICE} €/mes).`] : []),
    'Quiero confirmar alcance, dominio, alojamiento, impuestos, renovaciones y plazo en un presupuesto escrito antes de empezar.',
    `Referencia: ${ref}`,
  ];
  const text = lines.join('\n');
  return {
    text,
    whatsapp: `https://wa.me/${BAYENDABA_WHATSAPP}?text=${encodeURIComponent(text)}`,
    email: `mailto:${BAYENDABA_EMAIL}?subject=${encodeURIComponent(english ? 'My website · MisAutónomos' : 'Mi página web · MisAutónomos')}&body=${encodeURIComponent(text)}`,
  };
}
