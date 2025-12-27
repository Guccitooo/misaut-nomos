import React from "react";

// Textos SEO optimizados por categoría
export const CATEGORY_SEO_CONTENT = {
  'Electricista': {
    intro: "Encuentra electricistas profesionales certificados y verificados cerca de ti. Nuestros autónomos ofrecen servicios de instalaciones eléctricas, reparaciones, certificados eléctricos, boletines y mantenimiento. Todos están dados de alta en Hacienda y pueden emitir factura electrónica. Compara presupuestos gratis sin compromiso y contrata al mejor profesional para tu proyecto eléctrico.",
    keywords: ['electricista certificado', 'instalación eléctrica', 'boletín eléctrico', 'reparación instalación', 'certificado eléctrico', 'mantenimiento eléctrico', 'cuadro eléctrico', 'autónomo electricista'],
    relatedCategories: ['Instalador de aire acondicionado', 'Mantenimiento general', 'Albañil / Reformas'],
    ctaText: "Pide presupuesto gratis a electricistas verificados"
  },
  'Fontanero': {
    intro: "Contacta con fontaneros profesionales autónomos de confianza. Servicios de reparación de fugas, instalación de calderas, desatascos, cambio de grifería, y mantenimiento de fontanería. Todos los profesionales pueden emitir factura con IVA. Solicita varios presupuestos gratuitos y elige al fontanero que mejor se adapte a tus necesidades y presupuesto.",
    keywords: ['fontanero urgente', 'reparación fugas', 'instalación caldera', 'desatasco tuberías', 'cambio grifería', 'fontanero autónomo', 'presupuesto fontanero', 'servicio fontanería'],
    relatedCategories: ['Instalador de aire acondicionado', 'Mantenimiento general', 'Albañil / Reformas'],
    ctaText: "Solicita presupuesto sin compromiso"
  },
  'Carpintero': {
    intro: "Encuentra carpinteros profesionales especializados en muebles a medida, armarios empotrados, puertas, ventanas y trabajos de ebanistería. Autónomos con amplia experiencia en carpintería de madera, aluminio y PVC. Todos están registrados en Hacienda y gestionan su facturación de forma profesional. Compara presupuestos y contrata al mejor carpintero para tu proyecto.",
    keywords: ['carpintero muebles medida', 'armarios empotrados', 'puertas carpintero', 'ebanistería', 'carpintería madera', 'restauración muebles', 'carpintero autónomo', 'presupuesto carpintería'],
    relatedCategories: ['Pintor', 'Albañil / Reformas', 'Mantenimiento general'],
    ctaText: "Pide presupuesto a carpinteros profesionales"
  },
  'Pintor': {
    intro: "Contrata pintores profesionales autónomos para pintura de interiores, exteriores, fachadas, locales comerciales y viviendas. Servicios de alisado de paredes, estucado, papel pintado y acabados decorativos. Todos los profesionales están dados de alta como autónomos y emiten factura. Solicita presupuestos gratuitos y compara precios para tu proyecto de pintura.",
    keywords: ['pintor profesional', 'pintura interiores', 'pintura fachadas', 'alisado paredes', 'pintor autónomo', 'presupuesto pintura', 'estucado', 'papel pintado'],
    relatedCategories: ['Carpintero', 'Albañil / Reformas', 'Mantenimiento general'],
    ctaText: "Solicita presupuesto de pintura gratis"
  },
  'Jardinero': {
    intro: "Encuentra jardineros profesionales para mantenimiento de jardines, diseño paisajístico, poda de árboles, césped, riego automático y limpieza de parcelas. Autónomos especializados en jardinería que emiten factura y están dados de alta. Compara presupuestos sin compromiso y contrata servicios de jardinería de calidad para tu hogar o negocio.",
    keywords: ['jardinero profesional', 'mantenimiento jardín', 'diseño paisajístico', 'poda árboles', 'riego automático', 'césped artificial', 'jardinero autónomo', 'presupuesto jardinería'],
    relatedCategories: ['Mantenimiento de piscinas', 'Mantenimiento general', 'Transportista'],
    ctaText: "Pide presupuesto a jardineros verificados"
  },
  'Transportista': {
    intro: "Servicios de transporte y mudanzas con transportistas autónomos profesionales. Mudanzas locales, nacionales e internacionales, transporte de muebles, mercancías y vehículos. Todos los profesionales están dados de alta como autónomos y emiten factura oficial. Solicita varios presupuestos gratuitos y compara precios para tu servicio de transporte.",
    keywords: ['transportista autónomo', 'mudanzas profesionales', 'transporte muebles', 'mudanza nacional', 'transporte mercancías', 'presupuesto mudanza', 'portes', 'furgoneta mudanza'],
    relatedCategories: ['Empresa multiservicios', 'Mantenimiento general', 'Autónomo de limpieza'],
    ctaText: "Solicita presupuesto de transporte sin compromiso"
  },
  'Cerrajero': {
    intro: "Encuentra cerrajeros profesionales 24 horas para apertura de puertas, cambio de cerraduras, duplicado de llaves, instalación de bombines de seguridad y cajas fuertes. Autónomos certificados que emiten factura y están dados de alta en Hacienda. Solicita presupuestos gratuitos para servicios de cerrajería urgentes o programados.",
    keywords: ['cerrajero urgente 24h', 'apertura puertas', 'cambio cerraduras', 'bombin seguridad', 'cerrajero autónomo', 'duplicado llaves', 'caja fuerte', 'presupuesto cerrajería'],
    relatedCategories: ['Mantenimiento general', 'Instalador de aire acondicionado', 'Electricista'],
    ctaText: "Contacta con cerrajeros profesionales"
  },
  'Albañil / Reformas': {
    intro: "Albañiles profesionales autónomos especializados en reformas integrales, construcción, rehabilitación de viviendas, alicatado, solados y obra nueva. Todos los profesionales emiten factura y están registrados como autónomos en Hacienda. Solicita presupuestos detallados sin compromiso para tu reforma o proyecto de construcción.",
    keywords: ['albañil profesional', 'reforma integral', 'rehabilitación vivienda', 'alicatado', 'solado', 'obra nueva', 'albañil autónomo', 'presupuesto reforma'],
    relatedCategories: ['Pintor', 'Carpintero', 'Electricista', 'Fontanero'],
    ctaText: "Pide presupuesto de reforma gratis"
  },
  'Autónomo de limpieza': {
    intro: "Servicios profesionales de limpieza con autónomos especializados en limpieza de hogares, oficinas, comunidades, limpieza de obra y fin de obra. Todos están dados de alta y emiten factura electrónica. Compara presupuestos gratuitos de diferentes profesionales y contrata el servicio de limpieza que mejor se adapte a tus necesidades.",
    keywords: ['limpieza profesional', 'limpieza hogares', 'limpieza oficinas', 'limpieza comunidades', 'limpieza fin obra', 'autónomo limpieza', 'presupuesto limpieza', 'servicio limpieza'],
    relatedCategories: ['Mantenimiento general', 'Jardinero', 'Empresa multiservicios'],
    ctaText: "Solicita presupuesto de limpieza"
  },
  'Instalador de aire acondicionado': {
    intro: "Instaladores profesionales de aire acondicionado certificados. Servicios de instalación, mantenimiento, reparación y recarga de gas de sistemas de climatización. Autónomos especializados que emiten factura y certificado de instalación según normativa vigente. Solicita presupuestos gratuitos y compara precios para tu instalación de aire acondicionado o calefacción.",
    keywords: ['instalador aire acondicionado', 'instalación climatización', 'mantenimiento aire', 'reparación aire acondicionado', 'recarga gas', 'split instalación', 'autónomo climatización', 'certificado instalación'],
    relatedCategories: ['Electricista', 'Fontanero', 'Mantenimiento general'],
    ctaText: "Pide presupuesto de instalación"
  },
  'Mantenimiento general': {
    intro: "Profesionales autónomos especializados en servicios de mantenimiento integral de viviendas, comunidades y locales comerciales. Pequeñas reparaciones, mantenimiento preventivo, bricolaje y servicios multitarea. Todos emiten factura como autónomos. Solicita presupuestos sin compromiso para el mantenimiento de tu hogar o negocio.",
    keywords: ['mantenimiento hogar', 'reparaciones domésticas', 'mantenimiento comunidades', 'bricolaje profesional', 'mantenimiento preventivo', 'autónomo mantenimiento', 'presupuesto mantenimiento', 'servicio técnico'],
    relatedCategories: ['Electricista', 'Fontanero', 'Pintor', 'Carpintero'],
    ctaText: "Contacta con profesionales de mantenimiento"
  },
  'Asesoría o gestoría': {
    intro: "Encuentra asesores y gestores autónomos especializados en gestión fiscal, contabilidad, alta de autónomos, tramitación de ayudas, gestión laboral y asesoría jurídica. Profesionales colegiados que te ayudarán con Hacienda, Seguridad Social, declaraciones trimestrales de IVA, modelo 303, y facturación electrónica. Solicita presupuestos personalizados sin compromiso.",
    keywords: ['asesoría autónomos', 'gestoría fiscal', 'alta autónomo', 'contabilidad', 'declaración IVA', 'modelo 303', 'gestor autónomo', 'asesor fiscal', 'tramitación ayudas'],
    relatedCategories: ['Empresa multiservicios'],
    ctaText: "Solicita asesoramiento profesional"
  },
  'Empresa multiservicios': {
    intro: "Empresas y autónomos multiservicios que ofrecen soluciones integrales para tu hogar o negocio. Servicios de mantenimiento, reparaciones, reformas, limpieza, mudanzas y gestión de inmuebles. Todos los profesionales están dados de alta y emiten factura. Compara presupuestos gratuitos y contrata servicios múltiples con un solo proveedor.",
    keywords: ['empresa multiservicios', 'servicios integrales', 'mantenimiento integral', 'autónomo multiservicios', 'reformas y mantenimiento', 'presupuesto multiservicios', 'gestión inmuebles'],
    relatedCategories: ['Mantenimiento general', 'Autónomo de limpieza', 'Albañil / Reformas'],
    ctaText: "Pide presupuesto a empresas multiservicios"
  },
  'Mantenimiento de piscinas': {
    intro: "Profesionales autónomos especializados en mantenimiento de piscinas, limpieza, tratamiento de agua, reparación de equipos, instalación de depuradoras y apertura y cierre de temporada. Todos emiten factura y están registrados como autónomos. Solicita presupuestos gratuitos para el mantenimiento de tu piscina durante todo el año.",
    keywords: ['mantenimiento piscinas', 'limpieza piscina', 'tratamiento agua', 'reparación depuradora', 'autónomo piscinas', 'presupuesto piscina', 'apertura temporada', 'cloración'],
    relatedCategories: ['Jardinero', 'Mantenimiento general', 'Electricista'],
    ctaText: "Solicita presupuesto de mantenimiento"
  }
};

// Generar meta title optimizado (< 60 caracteres)
export function generateMetaTitle(categoryName, cityName) {
  if (cityName) {
    return `${categoryName}s en ${cityName} | Presupuesto Gratis`;
  }
  return `${categoryName}s Verificados | MisAutónomos`;
}

// Generar meta description optimizada (< 150 caracteres)
export function generateMetaDescription(categoryName, cityName) {
  if (cityName) {
    return `✅ Contrata ${categoryName.toLowerCase()}s en ${cityName}. Profesionales verificados, factura legal. ¡Pide presupuesto gratis ahora!`;
  }
  return `✅ Encuentra ${categoryName.toLowerCase()}s autónomos en España. Compara precios, contrata verificados. ¡Presupuesto gratis sin compromiso!`;
}

// Componente de introducción SEO
export function CategoryIntro({ categoryName, cityName, profileCount }) {
  const content = CATEGORY_SEO_CONTENT[categoryName];
  
  if (!content) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="prose max-w-none">
        <p className="text-gray-700 leading-relaxed">
          {content.intro.replace('cerca de ti', cityName ? `en ${cityName}` : 'en toda España')}
        </p>
        
        {profileCount > 0 && (
          <p className="text-sm text-gray-600 mt-3">
            <strong>{profileCount} profesionales disponibles</strong> {cityName ? `en ${cityName}` : 'en España'} listos para ayudarte. 
            Todos están dados de alta como autónomos, emiten factura oficial y han sido verificados por MisAutónomos.
          </p>
        )}
      </div>
    </div>
  );
}

// Componente de categorías relacionadas
export function RelatedCategories({ currentCategory, cityName, navigate, createPageUrl, slugify }) {
  const content = CATEGORY_SEO_CONTENT[currentCategory];
  
  if (!content || !content.relatedCategories) return null;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Servicios relacionados {cityName ? `en ${cityName}` : ''}
      </h2>
      <div className="flex flex-wrap gap-2">
        {content.relatedCategories.map(category => {
          const categorySlug = slugify(category);
          const url = cityName 
            ? `${createPageUrl("Categoria")}?name=${categorySlug}&ciudad=${slugify(cityName)}`
            : `${createPageUrl("Categoria")}?name=${categorySlug}`;
          
          return (
            <button
              key={category}
              onClick={() => window.location.href = url}
              className="px-4 py-2 bg-white rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium text-gray-700 hover:text-blue-700"
            >
              {category} {cityName ? `en ${cityName}` : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Componente de FAQ estructurado para rich snippets
export function CategoryFAQ({ categoryName, cityName }) {
  const faqs = [
    {
      question: `¿Cómo puedo contratar un ${categoryName.toLowerCase()} ${cityName ? `en ${cityName}` : ''}?`,
      answer: `Busca ${categoryName.toLowerCase()}s verificados, compara presupuestos gratis y contacta directamente. Todos emiten factura legal.`
    },
    {
      question: `¿Los ${categoryName.toLowerCase()}s están dados de alta?`,
      answer: `Sí, todos los profesionales de MisAutónomos están registrados como autónomos en Hacienda y emiten factura oficial.`
    },
    {
      question: `¿Es gratis pedir presupuesto?`,
      answer: `Totalmente gratis y sin compromiso. Compara varios presupuestos antes de decidir.`
    },
    {
      question: `¿Cuánto cobra un ${categoryName.toLowerCase()} ${cityName ? `en ${cityName}` : ''}?`,
      answer: `Los precios varían según el servicio. Solicita presupuestos personalizados a varios profesionales para comparar.`
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Preguntas frecuentes sobre {categoryName.toLowerCase()}s {cityName ? `en ${cityName}` : ''}
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
            <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
            <p className="text-gray-700 text-sm">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Structured data para Google rich snippets
export function generateCategoryStructuredData(categoryName, cityName, profiles, canonicalUrl) {
  const content = CATEGORY_SEO_CONTENT[categoryName] || {};
  
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${categoryName}s ${cityName ? `en ${cityName}` : 'en España'}`,
    "description": content.intro || `Encuentra ${categoryName.toLowerCase()}s profesionales verificados`,
    "url": canonicalUrl,
    "numberOfItems": profiles.length,
    "itemListElement": profiles.slice(0, 10).map((profile, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "LocalBusiness",
        "name": profile.business_name,
        "description": profile.descripcion_corta || `${categoryName} profesional`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": profile.ciudad,
          "addressRegion": profile.provincia,
          "addressCountry": "ES"
        },
        ...(profile.average_rating > 0 && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": profile.average_rating,
            "reviewCount": profile.total_reviews
          }
        })
      }
    }))
  };
}