import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../ui/LanguageSwitcher';

export default function SEOHead({ 
  title = "MisAutónomos - Tu autónomo de confianza en España",
  description = "Encuentra y contacta con los mejores profesionales autónomos verificados cerca de ti. Electricistas, fontaneros, carpinteros y más. 100% gratis para clientes.",
  image = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/f1c507180_123.png",
  type = "website",
  keywords = "autónomos, profesionales, servicios, España, electricista, fontanero, carpintero, reformas",
  author = "MisAutónomos",
  publishedTime,
  modifiedTime,
  noindex = false
}) {
  const location = useLocation();
  const { language } = useLanguage();
  const baseUrl = "https://misautonomos.es";
  const canonicalUrl = baseUrl + location.pathname;

  useEffect(() => {
    // Title
    document.title = title;
    
    // Helper to create or update meta tags
    const updateMetaTag = (name, content, isProperty = false, isHttpEquiv = false) => {
      if (!content) return;
      
      const attribute = isHttpEquiv ? 'http-equiv' : (isProperty ? 'property' : 'name');
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    updateMetaTag('language', language === 'es' ? 'Spanish' : 'English');
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');
    updateMetaTag('googlebot', noindex ? 'noindex, nofollow' : 'index, follow');
    
    // Theme and color
    updateMetaTag('theme-color', '#3b82f6');
    updateMetaTag('msapplication-TileColor', '#3b82f6');
    
    // Viewport - ensure proper mobile rendering
    updateMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5');
    
    // Content type
    updateMetaTag('Content-Type', 'text/html; charset=UTF-8', false, true);
    
    // OpenGraph tags
    updateMetaTag('og:site_name', 'MisAutónomos', true);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:locale', language === 'es' ? 'es_ES' : 'en_US', true);
    if (publishedTime) updateMetaTag('article:published_time', publishedTime, true);
    if (modifiedTime) updateMetaTag('article:modified_time', modifiedTime, true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:site', '@MisAutonomos');
    
    // Canonical URL - limpiar parámetros de query para evitar duplicados
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    // Usar URL sin query params como canónica
    const cleanCanonicalUrl = canonicalUrl.split('?')[0];
    canonical.setAttribute('href', cleanCanonicalUrl);

    // Hreflang for alternate languages
    const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingHreflangs.forEach(link => link.remove());

    const hreflangEs = document.createElement('link');
    hreflangEs.setAttribute('rel', 'alternate');
    hreflangEs.setAttribute('hreflang', 'es');
    hreflangEs.setAttribute('href', canonicalUrl);
    document.head.appendChild(hreflangEs);

    const hreflangEn = document.createElement('link');
    hreflangEn.setAttribute('rel', 'alternate');
    hreflangEn.setAttribute('hreflang', 'en');
    hreflangEn.setAttribute('href', canonicalUrl);
    document.head.appendChild(hreflangEn);

    const hreflangXDefault = document.createElement('link');
    hreflangXDefault.setAttribute('rel', 'alternate');
    hreflangXDefault.setAttribute('hreflang', 'x-default');
    hreflangXDefault.setAttribute('href', canonicalUrl);
    document.head.appendChild(hreflangXDefault);

    // Preconnect to external domains for performance
    const preconnectDomains = [
      'https://qtrypzzcjebvfcihiynt.supabase.co',
      'https://www.googletagmanager.com'
    ];

    preconnectDomains.forEach(domain => {
      let preconnect = document.querySelector(`link[rel="preconnect"][href="${domain}"]`);
      if (!preconnect) {
        preconnect = document.createElement('link');
        preconnect.setAttribute('rel', 'preconnect');
        preconnect.setAttribute('href', domain);
        preconnect.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(preconnect);
      }
    });

    // DNS prefetch
    let dnsPrefetch = document.querySelector('link[rel="dns-prefetch"][href="https://qtrypzzcjebvfcihiynt.supabase.co"]');
    if (!dnsPrefetch) {
      dnsPrefetch = document.createElement('link');
      dnsPrefetch.setAttribute('rel', 'dns-prefetch');
      dnsPrefetch.setAttribute('href', 'https://qtrypzzcjebvfcihiynt.supabase.co');
      document.head.appendChild(dnsPrefetch);
    }

    // Structured Data - Organization
    let structuredDataOrg = document.getElementById('structured-data-org');
    if (!structuredDataOrg) {
      structuredDataOrg = document.createElement('script');
      structuredDataOrg.setAttribute('type', 'application/ld+json');
      structuredDataOrg.setAttribute('id', 'structured-data-org');
      document.head.appendChild(structuredDataOrg);
    }
    structuredDataOrg.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "MisAutónomos",
      "url": "https://misautonomos.es",
      "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png",
      "description": description,
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "soporte@misautonomos.es",
        "contactType": "customer support",
        "areaServed": "ES"
      },
      "sameAs": [
        "https://facebook.com/misautonomos",
        "https://instagram.com/misautonomos",
        "https://linkedin.com/company/misautonomos"
      ]
    });
    
  }, [title, description, image, canonicalUrl, keywords, type, author, language, publishedTime, modifiedTime, noindex]);

  return null;
}