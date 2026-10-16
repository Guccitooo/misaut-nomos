import { useSyncExternalStore } from 'react';
import { slugify } from './slugify';
import { ordenarFichas } from './ordenFichas';

// Only the public, explicitly selected fields used by the rendered page live
// here. Authentication, user rows and private account data never enter HTML.
let browserData;
export function getPublicPageData() {
  if (typeof document === 'undefined') return globalThis.__MIS_PUBLIC_PAGE_DATA__ || {};
  if (browserData === undefined) {
    const element = document.getElementById('public-page-data');
    try { browserData = element ? JSON.parse(element.textContent) : {}; }
    catch { browserData = {}; }
  }
  return browserData;
}

const subscribe = () => () => {};
export function useHydrationReady() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function isPublicPath(pathname) {
  return ['/', '/buscar', '/blog', '/preguntas-frecuentes', '/ayuda', '/para-autonomos', '/tu-web', '/contacto', '/privacidad', '/terminos', '/cookies', '/aviso-legal', '/404'].includes(pathname)
    || /^\/(autonomo|categoria|blog)\/.+/.test(pathname);
}

export function seedPublicQueries(client, data) {
  const options = { updatedAt: data.generatedAt || Date.now() };
  if (data.categories) client.setQueryData(['serviceCategories'], data.categories, options);
  if (data.profiles) client.setQueryData(['professionalProfiles'], data.profiles, options);
  if (data.profile) {
    const slug = slugify(data.profile.slug_publico || data.profile.business_name);
    client.setQueryData(['autonomoBySlug', slug], { profile: data.profile, redirect: null }, options);
  }
  if (data.categoryProfiles) {
    const [, , category, city] = data.path.split('/');
    client.setQueryData(['categoryProfiles', category, city || null], ordenarFichas(data.categoryProfiles, 1), options);
  }
}
