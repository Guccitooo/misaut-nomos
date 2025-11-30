import { useEffect } from 'react';

export default function WebsiteSchema() {
  useEffect(() => {
    let script = document.getElementById('structured-data-website');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data-website');
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "MisAutónomos",
      "alternateName": "Mis Autónomos",
      "url": "https://misautonomos.es",
      "description": "Plataforma líder en España para conectar clientes con profesionales autónomos verificados",
      "inLanguage": ["es", "en"],
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://misautonomos.es/Search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "MisAutónomos",
        "logo": {
          "@type": "ImageObject",
          "url": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png"
        }
      }
    });

    return () => {
      const existingScript = document.getElementById('structured-data-website');
      if (existingScript) existingScript.remove();
    };
  }, []);

  return null;
}