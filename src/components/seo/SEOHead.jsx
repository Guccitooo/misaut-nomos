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
  noindex = false,
  structuredData = null,
  rating = null,
  reviewCount = null
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
    
    // Rich Snippets adicionales para perfiles
    if (rating && reviewCount) {
      updateMetaTag('rating', rating.toString());
      updateMetaTag('reviewCount', reviewCount.toString());
    } else {
      // Limpiar ratings previos si ya no aplican
      const ratingMeta = document.querySelector('meta[name="rating"]');
      const reviewMeta = document.querySelector('meta[name="reviewCount"]');
      if (ratingMeta) ratingMeta.remove();
      if (reviewMeta) reviewMeta.remove();
    }
    
    // Canonical URL - limpiar parámetros de query para evitar duplicados
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const cleanCanonicalUrl = canonicalUrl.split('?')[0];
    canonical.setAttribute('href', cleanCanonicalUrl);

    // No usar Cache-Control en meta tag (no es estándar y puede confundir a bots)

    // Hreflang for alternate languages - limpiar todos antes de crear nuevos
    const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingHreflangs.forEach(link => link.remove());

    const cleanUrl = canonicalUrl.split('?')[0]; // URL limpia sin parámetros

    const hreflangEs = document.createElement('link');
    hreflangEs.setAttribute('rel', 'alternate');
    hreflangEs.setAttribute('hreflang', 'es');
    hreflangEs.setAttribute('href', cleanUrl);
    document.head.appendChild(hreflangEs);

    const hreflangEn = document.createElement('link');
    hreflangEn.setAttribute('rel', 'alternate');
    hreflangEn.setAttribute('hreflang', 'en');
    hreflangEn.setAttribute('href', cleanUrl);
    document.head.appendChild(hreflangEn);

    const hreflangXDefault = document.createElement('link');
    hreflangXDefault.setAttribute('rel', 'alternate');
    hreflangXDefault.setAttribute('hreflang', 'x-default');
    hreflangXDefault.setAttribute('href', cleanUrl);
    document.head.appendChild(hreflangXDefault);

    // Preconnect y DNS prefetch - crear solo una vez
    const preconnectUrls = [
      'https://qtrypzzcjebvfcihiynt.supabase.co',
      'https://fonts.gstatic.com'
    ];

    preconnectUrls.forEach(url => {
      if (!document.querySelector(`link[rel="preconnect"][href="${url}"]`)) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'preconnect');
        link.setAttribute('href', url);
        link.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(link);
      }
    });

    const dnsPrefetchUrls = [
      'https://fonts.googleapis.com',
      'https://www.googletagmanager.com'
    ];

    dnsPrefetchUrls.forEach(url => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="${url}"]`)) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'dns-prefetch');
        link.setAttribute('href', url);
        document.head.appendChild(link);
      }
    });



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
      "logo": {
        "@type": "ImageObject",
        "url": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png",
        "width": 512,
        "height": 512
      },
      "description": description,
      "foundingDate": "2024",
      "areaServed": {
        "@type": "Country",
        "name": "España"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "soporte@misautonomos.es",
        "contactType": "customer support",
        "areaServed": "ES",
        "availableLanguage": ["Spanish", "English"]
      },
      "sameAs": [
        "https://facebook.com/misautonomos",
        "https://instagram.com/misautonomos",
        "https://linkedin.com/company/misautonomos"
      ]
    });

    // Custom structured data if provided
    let customScript = document.getElementById('structured-data-custom');
    if (structuredData) {
      if (!customScript) {
        customScript = document.createElement('script');
        customScript.setAttribute('type', 'application/ld+json');
        customScript.setAttribute('id', 'structured-data-custom');
        document.head.appendChild(customScript);
      }
      customScript.textContent = JSON.stringify(structuredData);
    } else if (customScript) {
      // Limpiar structured data previo si ya no se proporciona
      customScript.remove();
    }
    
  }, [title, description, image, canonicalUrl, keywords, type, author, language, publishedTime, modifiedTime, noindex, structuredData]);

  return null;
}