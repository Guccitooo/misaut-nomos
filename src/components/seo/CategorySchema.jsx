import { useEffect } from 'react';

export default function CategorySchema({ categoryName, professionals, location }) {
  useEffect(() => {
    if (!categoryName) return;

    let script = document.getElementById('structured-data-category');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data-category');
      document.head.appendChild(script);
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${categoryName} en ${location || 'España'}`,
      "description": `Encuentra profesionales de ${categoryName} verificados en ${location || 'toda España'}`,
      "numberOfItems": professionals?.length || 0,
      "itemListElement": (professionals || []).slice(0, 20).map((prof, index) => {
        const profileSlug = prof.slug_publico || prof.business_name?.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        return {
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "ProfessionalService",
            "@id": `https://misautonomos.es/Autonomo?slug=${profileSlug}`,
            "name": prof.business_name,
            "description": prof.descripcion_corta || `${categoryName} profesional`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": prof.ciudad,
              "addressRegion": prof.provincia,
              "addressCountry": "ES"
            },
            ...(prof.average_rating > 0 && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": prof.average_rating.toFixed(1),
                "reviewCount": prof.total_reviews || 1,
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }
        };
      })
    };

    script.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.getElementById('structured-data-category');
      if (existing) existing.remove();
    };
  }, [categoryName, professionals, location]);

  return null;
}