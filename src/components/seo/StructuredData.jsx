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
    
    // Filtrar FAQs inválidas y asegurar que tienen name y text
    const validFaqs = faqs.filter(faq => {
      const question = faq.question || faq.name;
      const answer = faq.answer || faq.text;
      return question && question.trim() !== '' && answer && answer.trim() !== '';
    });

    if (validFaqs.length === 0) return;
    
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": validFaqs.map(faq => ({
        "@type": "Question",
        "name": String(faq.question || faq.name).trim(),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": String(faq.answer || faq.text).trim()
        }
      }))
    });

    return () => {
      const existingScript = document.getElementById('structured-data-faq');
      if (existingScript) existingScript.remove();
    };
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

    // Generar slug para URL canónica
    const slugify = (text) => {
      if (!text) return '';
      return text.toString().toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/ñ/g, 'n').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    };
    const profileSlug = profile.slug_publico || slugify(profile.business_name);
    const profileUrl = `https://misautonomos.es/Autonomo?slug=${profileSlug}`;
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "@id": profileUrl,
      "name": profile.business_name,
      "description": profile.descripcion_corta || profile.description || `${profile.business_name} - Profesional autónomo en ${profile.ciudad || profile.provincia}`,
      "image": profile.imagen_principal || (profile.photos && profile.photos[0]) || professionalUser?.profile_picture,
      "url": profileUrl,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": profileUrl
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": profile.ciudad || "",
        "addressRegion": profile.provincia || "",
        "addressCountry": "ES"
      },
      "areaServed": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "name": `${profile.ciudad || ''}, ${profile.provincia || ''}`
        },
        "geoRadius": `${(profile.radio_servicio_km || 10) * 1000}`
      },
      ...(profile.telefono_contacto && { "telephone": profile.telefono_contacto }),
      ...(profile.email_contacto && { "email": profile.email_contacto }),
      "priceRange": profile.price_range || "€€",
      ...(profile.formas_pago?.length > 0 && { "paymentAccepted": profile.formas_pago.join(', ') }),
      ...(profile.categories?.length > 0 && { 
        "knowsAbout": profile.categories,
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Servicios profesionales",
          "itemListElement": profile.categories.map((cat, idx) => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": cat
            }
          }))
        }
      }),
      ...(profile.years_experience > 0 && { 
        "foundingDate": new Date().getFullYear() - profile.years_experience
      }),
      ...(profile.certifications?.length > 0 && {
        "hasCredential": profile.certifications.map(cert => ({
          "@type": "EducationalOccupationalCredential",
          "credentialCategory": "certification",
          "name": cert
        }))
      }),
      ...(profile.website && { "sameAs": [profile.website] }),
      ...(profile.social_links && { 
        "sameAs": [
          profile.social_links.facebook,
          profile.social_links.instagram,
          profile.social_links.linkedin,
          profile.social_links.tiktok
        ].filter(Boolean) 
      }),
      ...(profile.average_rating > 0 && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": profile.average_rating.toFixed(1),
          "reviewCount": profile.total_reviews || 1,
          "bestRating": "5",
          "worstRating": "1"
        }
      }),
      ...(reviews && reviews.length > 0 && {
        "review": reviews.slice(0, 10).map(review => ({
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": review.client_name || "Cliente verificado"
          },
          "datePublished": review.created_date?.split('T')[0],
          ...(review.comment && { "reviewBody": review.comment }),
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": review.rating?.toString() || "5",
            "bestRating": "5",
            "worstRating": "1"
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
      },
      "isPartOf": {
        "@type": "WebSite",
        "name": "MisAutónomos",
        "url": "https://misautonomos.es"
      }
    };
    
    script.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.getElementById('structured-data-business');
      if (existing) existing.remove();
    };
  }, [profile, reviews, professionalUser]);

  return null;
}

// Schema para Person/Professional
export function ProfessionalPersonSchema({ profile, professionalUser }) {
  useEffect(() => {
    if (!profile) return;
    
    let script = document.getElementById('structured-data-person');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'structured-data-person');
      document.head.appendChild(script);
    }

    const slugify = (text) => {
      if (!text) return '';
      return text.toString().toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/ñ/g, 'n').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    };
    const profileSlug = profile.slug_publico || slugify(profile.business_name);
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": profile.business_name,
      "jobTitle": profile.categories?.[0] || "Profesional autónomo",
      "description": profile.descripcion_corta,
      "image": professionalUser?.profile_picture || profile.imagen_principal,
      "url": `https://misautonomos.es/Autonomo?slug=${profileSlug}`,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": profile.ciudad,
        "addressRegion": profile.provincia,
        "addressCountry": "ES"
      },
      ...(profile.skills?.length > 0 && { "knowsAbout": profile.skills }),
      ...(profile.years_experience > 0 && { 
        "hasOccupation": {
          "@type": "Occupation",
          "name": profile.categories?.[0] || "Profesional",
          "experienceRequirements": `${profile.years_experience} años de experiencia`
        }
      }),
      "worksFor": {
        "@type": "Organization",
        "name": profile.business_name
      }
    };
    
    script.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.getElementById('structured-data-person');
      if (existing) existing.remove();
    };
  }, [profile, professionalUser]);

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