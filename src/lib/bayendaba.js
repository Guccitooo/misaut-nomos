export const BAYENDABA_WHATSAPP = '34644853733';
export const BAYENDABA_EMAIL = 'contact@bayendaba.com';
export const PROJECT_STARTING_PRICE = 200;
export const PROJECT_TYPES = Object.freeze(['web', 'apps', 'software', 'bookings', 'automation', 'ai', 'other']);

const SOURCES = new Set(['home', 'dashboard', 'para-autonomos', 'footer', 'nav', 'direct']);
export function offerSource(value) {
  return SOURCES.has(value) ? value : 'direct';
}

export function offerPath(source = 'direct') {
  return `/tu-web?origen=${offerSource(source)}`;
}

const clean = (value, max) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const PROJECT_LABELS = {
  es: {
    web: 'Página web o tienda online', apps: 'Aplicación móvil', software: 'Software de gestión / CRM',
    bookings: 'Reservas y presupuestos', automation: 'Automatización de procesos', ai: 'Soluciones con IA', other: 'Otro proyecto / necesito asesoramiento',
  },
  en: {
    web: 'Website or online store', apps: 'Mobile app', software: 'Business software / CRM',
    bookings: 'Bookings and quotes', automation: 'Process automation', ai: 'AI solutions', other: 'Another project / I need advice',
  },
};

// This only prepares a message. The visitor chooses WhatsApp or their email
// app and decides whether to send it; no form data is stored or submitted here.
export function buildWebRequest({ business, activity, details, projectType, source, language = 'es' } = {}) {
  const english = language.startsWith('en');
  const name = clean(business, 100);
  const service = clean(activity, 100);
  const note = clean(details, 3000);
  const type = PROJECT_TYPES.includes(projectType) ? PROJECT_LABELS[english ? 'en' : 'es'][projectType] : '';
  const ref = `MA-WEB / ${offerSource(source)}`;
  const lines = english ? [
    'Hello BayenDaba! I found you on MisAutónomos and would like to discuss a digital project.',
    'I would like a personalised quote with no obligation.',
    ...(type ? [`Interested in: ${type}`] : []),
    ...(name ? [`Business: ${name}`] : []),
    ...(service ? [`Activity: ${service}`] : []),
    ...(note ? [`My project: ${note}`] : []),
    'Please tell me about your proposal, pricing and delivery timeline.',
    `Reference: ${ref}`,
  ] : [
    '¡Hola BayenDaba! Os he encontrado en MisAutónomos y quiero hablar de un proyecto digital.',
    'Me gustaría recibir un presupuesto personalizado sin compromiso.',
    ...(type ? [`Me interesa: ${type}`] : []),
    ...(name ? [`Negocio: ${name}`] : []),
    ...(service ? [`Actividad: ${service}`] : []),
    ...(note ? [`Mi proyecto: ${note}`] : []),
    'Quisiera conocer vuestra propuesta, el presupuesto y los plazos.',
    `Referencia: ${ref}`,
  ];
  const text = lines.join('\n');
  return {
    text,
    whatsapp: `https://wa.me/${BAYENDABA_WHATSAPP}?text=${encodeURIComponent(text)}`,
    email: `mailto:${BAYENDABA_EMAIL}?subject=${encodeURIComponent(english ? 'My digital project · MisAutónomos' : 'Mi proyecto digital · MisAutónomos')}&body=${encodeURIComponent(text)}`,
  };
}
