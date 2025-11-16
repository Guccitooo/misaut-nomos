import { useEffect } from 'react';

export function OrganizationSchema() {
  useEffect(() => {
    let script = document.getElementById('structured-data-organization');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data-organization');
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "MisAutónomos",
      "alternateName": "Mis Autónomos",
      "url": "https://misautonomos.es",
      "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690076ad86e673c796768de5/47f6f564f_ChatGPTImage13nov202511_25_45.png",
      "description": "Plataforma líder en España para conectar clientes con profesionales autónomos verificados. Electricistas, fontaneros, carpinteros y más.",
      "foundingDate": "2024",
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "soporte@misautonomos.es",
        "contactType": "customer support",
        "areaServed": "ES",
        "availableLanguage": ["Spanish", "English"]
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "ES"
      },
      "sameAs": [
        "https://facebook.com/misautonomos",
        "https://instagram.com/misautonomos",
        "https://linkedin.com/company/misautonomos"
      ]
    });
  }, []);

  return null;
}

export function ServiceSchema({ categories, location }) {
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    
    let script = document.getElementById('structured-data-service');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data-service');
      document.head.appendChild(script);
    }
    
    const services = categories.map(category => ({
      "@type": "Service",
      "serviceType": category,
      "provider": {
        "@type": "Organization",
        "name": "MisAutónomos"
      },
      "areaServed": {
        "@type": "City",
        "name": location || "España"
      }
    }));
    
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": services
    });
  }, [categories, location]);

  return null;
}

export function FAQPageSchema({ faqs }) {
  useEffect(() => {
    if (!faqs || faqs.length === 0) return;
    
    let script = document.getElementById('structured-data-faq');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data-faq');
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    });
  }, [faqs]);

  return null;
}

export function ProductSchema({ products }) {
  useEffect(() => {
    if (!products || products.length === 0) return;
    
    let script = document.getElementById('structured-data-product');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data-product');
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": products.map(product => ({
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock",
          "url": `https://misautonomos.es/PricingPlans`,
          "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      }))
    });
  }, [products]);

  return null;
}

export function LocalBusinessSchema({ profile, reviews, professionalUser }) {
  useEffect(() => {
    if (!profile) return;
    
    let script = document.getElementById('structured-data-business');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data-business');
      document.head.appendChild(script);
    }
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": profile.business_name,
      "description": profile.descripcion_corta || profile.description,
      "image": profile.photos || [],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": profile.ciudad,
        "addressRegion": profile.provincia,
        "addressCountry": "ES"
      },
      "geo": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "addressLocality": profile.ciudad,
          "addressRegion": profile.provincia
        },
        "geoRadius": `${profile.radio_servicio_km || 10}000`
      },
      "telephone": profile.telefono_contacto,
      "email": profile.email_contacto,
      "priceRange": profile.price_range || "€€",
      "paymentAccepted": profile.formas_pago?.join(', '),
      "servesCuisine": profile.categories?.join(', '),
      ...(profile.website && { "url": profile.website }),
      ...(profile.social_links?.facebook && { "sameAs": [
        profile.social_links.facebook,
        profile.social_links.instagram,
        profile.social_links.linkedin
      ].filter(Boolean) }),
      ...(profile.average_rating > 0 && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": profile.average_rating,
          "reviewCount": profile.total_reviews,
          "bestRating": 5,
          "worstRating": 1
        }
      }),
      ...(reviews && reviews.length > 0 && {
        "review": reviews.slice(0, 5).map(review => ({
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": review.client_name
          },
          "datePublished": review.created_date,
          "reviewBody": review.comment,
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": review.rating,
            "bestRating": 5,
            "worstRating": 1
          }
        }))
      }),
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": profile.disponibilidad_tipo === 'laborables' 
          ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          : profile.disponibilidad_tipo === 'festivos'
          ? ["Saturday", "Sunday"]
          : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": profile.horario_apertura || "09:00",
        "closes": profile.horario_cierre || "18:00"
      }
    };
    
    script.textContent = JSON.stringify(schema);
  }, [profile, reviews, professionalUser]);

  return null;
}

export function BreadcrumbSchema({ items }) {
  useEffect(() => {
    if (!items || items.length === 0) return;
    
    let script = document.getElementById('structured-data-breadcrumb');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data-breadcrumb');
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    });
  }, [items]);

  return null;
}