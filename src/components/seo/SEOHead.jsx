import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEOHead({ 
  title = "MisAutónomos - Tu autónomo de confianza en España",
  description = "Encuentra y contacta con los mejores profesionales autónomos verificados cerca de ti. Electricistas, fontaneros, carpinteros y más. 100% gratis para clientes.",
  image = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/f1c507180_123.png",
  type = "website",
  keywords = "autónomos, profesionales, servicios, España, electricista, fontanero, carpintero, reformas"
}) {
  const location = useLocation();
  const baseUrl = "https://misautonomos.es";
  const canonicalUrl = baseUrl + location.pathname;

  useEffect(() => {
    document.title = title;
    
    const updateMetaTag = (name, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'MisAutónomos', true);
    
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    let preconnect = document.querySelector('link[rel="preconnect"][href*="supabase"]');
    if (!preconnect) {
      preconnect = document.createElement('link');
      preconnect.setAttribute('rel', 'preconnect');
      preconnect.setAttribute('href', 'https://qtrypzzcjebvfcihiynt.supabase.co');
      document.head.appendChild(preconnect);
    }

    updateMetaTag('robots', 'index, follow');
    updateMetaTag('googlebot', 'index, follow');
    updateMetaTag('language', 'Spanish');
    updateMetaTag('author', 'MisAutónomos');
    
  }, [title, description, image, canonicalUrl, keywords, type]);

  return null;
}