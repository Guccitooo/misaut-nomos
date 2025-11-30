import { useEffect } from 'react';

export default function SubscriptionProductSchema({ plans = [] }) {
  useEffect(() => {
    if (!plans || plans.length === 0) return;

    let script = document.getElementById('structured-data-subscription');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data-subscription');
      document.head.appendChild(script);
    }

    const offers = plans.map(plan => ({
      "@type": "Offer",
      "name": plan.nombre || plan.plan_id,
      "price": plan.precio,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "url": "https://misautonomos.es/PricingPlans",
      "eligibleRegion": {
        "@type": "Country",
        "name": "ES"
      }
    }));

    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Suscripción MisAutónomos Pro",
      "description": "Suscripción profesional para autónomos. Incluye perfil visible, CRM, facturación y más. 2 meses gratis de prueba.",
      "brand": {
        "@type": "Brand",
        "name": "MisAutónomos"
      },
      "offers": offers,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "150",
        "bestRating": "5",
        "worstRating": "1"
      }
    });

    return () => {
      const existingScript = document.getElementById('structured-data-subscription');
      if (existingScript) existingScript.remove();
    };
  }, [plans]);

  return null;
}