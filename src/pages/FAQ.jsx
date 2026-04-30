import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, ArrowRight, Briefcase, Users, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SEOHead from "../components/seo/SEOHead";

// ─── Datos de las 20 preguntas ────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "autonomos",
    label: "Para autónomos",
    icon: Briefcase,
    color: "bg-blue-600",
    faqs: [
      {
        q: "¿Cómo darse de alta como autónomo en España en 2026?",
        a: "Para darte de alta como autónomo en España necesitas tres trámites: alta en Hacienda con el modelo 036 o 037, alta en la Seguridad Social en el RETA, y comunicación al ayuntamiento si abres un establecimiento físico. Todo el proceso es gratuito si lo haces tú mismo y se puede completar online en menos de una hora con certificado digital.",
        cta: "¿Necesitas un gestor que lo haga por ti? Encuentra uno en MisAutónomos",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Cuánto cuesta la cuota de autónomos en 2026?",
        a: "La cuota de autónomos en 2026 funciona por tramos según rendimientos netos: desde aproximadamente 230€/mes para los tramos más bajos hasta más de 590€/mes para los tramos altos. Los nuevos autónomos pueden acogerse a la tarifa plana de 80€/mes durante el primer año, prorrogable un año más si los ingresos son bajos.",
        cta: "Calcula tu cuota exacta con un asesor",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Qué impuestos paga un autónomo en España?",
        a: "Un autónomo en España paga principalmente IRPF (trimestral mediante modelo 130 o retenciones del 7-15%), IVA (modelo 303 trimestral, generalmente 21%), y la cuota mensual a la Seguridad Social. Además debe presentar resúmenes anuales (modelos 390 e IRPF anual con el modelo 100).",
        cta: "Habla con una gestoría especializada",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Qué gastos puede deducirse un autónomo?",
        a: "Un autónomo puede deducirse gastos directamente afectos a la actividad: alquiler del local, suministros (con limitación si trabajas desde casa, normalmente 30% del 30% de la vivienda), material de oficina, vehículo si es de uso exclusivo profesional, dietas, formación, seguros relacionados con la actividad y cuotas a colegios profesionales.",
        cta: "Optimiza tus deducciones con un asesor fiscal",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Cómo facturar siendo autónomo?",
        a: "Una factura de autónomo debe incluir: número correlativo, fecha de emisión, datos completos del emisor y receptor (nombre, NIF, dirección), descripción del servicio o producto, base imponible, IVA aplicado y total. Desde 2024 la factura electrónica es obligatoria entre empresas y autónomos en España.",
        cta: "¿Necesitas software de facturación o un gestor?",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Cuándo conviene ser autónomo y cuándo SL?",
        a: "Ser autónomo es más sencillo y barato al inicio (sin capital mínimo, gestión simple). Una SL conviene cuando tus beneficios netos superan aproximadamente 40.000-60.000€ anuales (porque la fiscalidad de Sociedades es del 25% fijo frente al IRPF progresivo del autónomo) o cuando quieres limitar la responsabilidad personal.",
        cta: "Consulta con un asesor cuál te conviene",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Qué es la tarifa plana de autónomos y quién puede acogerse?",
        a: "La tarifa plana es una cuota reducida de 80€/mes durante los primeros 12 meses para nuevos autónomos. Se puede prorrogar 12 meses más si los rendimientos netos no superan el SMI. Pueden acogerse autónomos que no hayan estado de alta en los 2 años anteriores (3 años si ya disfrutaron de tarifa plana antes).",
        cta: "Comprueba si cumples los requisitos",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Cuándo presentar el modelo 130 y para qué sirve?",
        a: "El modelo 130 es el pago fraccionado a cuenta del IRPF para autónomos en estimación directa. Se presenta trimestralmente: hasta el 20 de abril, 20 de julio, 20 de octubre, y 30 de enero del año siguiente. Se ingresa el 20% del beneficio neto acumulado del año, descontando lo ya pagado en trimestres anteriores.",
        cta: "Que un gestor presente tus impuestos",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Puedo ser autónomo y trabajar por cuenta ajena al mismo tiempo?",
        a: "Sí, se llama pluriactividad. Puedes compatibilizar empleo por cuenta ajena con actividad por cuenta propia. La Seguridad Social devuelve hasta el 50% de la cuota de autónomo durante los primeros 18 meses si tu salario por cuenta ajena supera el SMI.",
        cta: "Calcula la devolución que te corresponde",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Cómo darme de baja como autónomo?",
        a: "Para darte de baja debes presentar la baja en Hacienda (modelo 036/037) y en la Seguridad Social (modelo TA.0521) en un plazo máximo de 3 días desde el cese de la actividad. Si no cumples el plazo pueden imponer sanciones. Sigues obligado a presentar las declaraciones del trimestre en curso.",
        cta: "Que un gestor tramite tu baja",
        ctaUrl: "/buscar",
      },
    ],
  },
  {
    id: "clientes",
    label: "Para clientes",
    icon: Users,
    color: "bg-green-600",
    faqs: [
      {
        q: "¿Cómo encontrar un autónomo de confianza cerca de mí?",
        a: "Para encontrar un autónomo fiable comprueba: que esté dado de alta en el RETA (puedes pedirle el certificado), que tenga seguro de responsabilidad civil, valoraciones de otros clientes, presupuesto detallado por escrito antes de empezar, y factura siempre. En MisAutónomos todos los profesionales están verificados.",
        cta: "Buscar profesionales verificados en mi zona",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Cuánto cobra un autónomo por hora en España en 2026?",
        a: "Las tarifas varían mucho según el oficio: un fontanero o electricista factura entre 30 y 50€/hora, un programador freelance entre 35 y 80€/hora, un diseñador entre 25 y 60€/hora, una gestoría entre 60 y 150€/hora, un abogado autónomo entre 80 y 200€/hora. Pide siempre presupuesto cerrado para evitar sorpresas.",
        cta: "Pide presupuestos gratis a varios profesionales",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Es obligatorio que un autónomo me dé factura?",
        a: "Sí, todo autónomo está obligado por ley a emitir factura por cada servicio prestado. Si te niegan factura puedes denunciarlo a la Agencia Tributaria. La factura es la garantía legal de que el servicio fue prestado y te permite, en su caso, deducir el IVA si eres empresa o autónomo.",
        cta: "Trabaja con autónomos que siempre facturan",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Qué hacer si un autónomo no termina el trabajo o desaparece?",
        a: "Reúne todas las pruebas (contrato, presupuestos firmados, mensajes, pagos), envíale un burofax con plazo de cumplimiento, y si no responde puedes presentar reclamación en consumo (si eres particular) o demanda judicial. Para evitar este riesgo, contrata siempre profesionales con valoraciones verificadas y nunca pagues el 100% por adelantado.",
        cta: "Contrata profesionales verificados con garantía",
        ctaUrl: "/buscar",
      },
      {
        q: "¿Es más barato un autónomo o una empresa?",
        a: "Generalmente sí, un autónomo suele ser más barato porque tiene menos costes estructurales. Pero hay diferencias importantes: una empresa suele dar más garantías formales, mayor capacidad de respuesta ante grandes proyectos y continuidad. Para trabajos puntuales y medianos, el autónomo es la opción más eficiente en precio.",
        cta: "Compara presupuestos de autónomos en tu zona",
        ctaUrl: "/buscar",
      },
    ],
  },
  {
    id: "plataforma",
    label: "Sobre MisAutónomos",
    icon: HelpCircle,
    color: "bg-purple-600",
    faqs: [
      {
        q: "¿Qué es MisAutónomos y cómo funciona?",
        a: "MisAutónomos es una plataforma que conecta clientes con autónomos verificados en toda España. Los clientes publican qué necesitan, los profesionales envían presupuestos, y tras comparar el cliente elige al que prefiere. Para los autónomos es una forma de conseguir clientes nuevos sin invertir en publicidad.",
        cta: "Regístrate gratis",
        ctaUrl: "/precios",
      },
      {
        q: "¿Es gratis registrarse en MisAutónomos como autónomo?",
        a: "Sí, registrarse como autónomo en MisAutónomos es completamente gratis y sin permanencia. Puedes crear tu perfil profesional, recibir solicitudes de presupuesto y trabajar con clientes sin pagar nada. Disponemos de planes de pago opcionales (Visibilidad y Ads+) para profesionales que quieran aparecer destacados en las búsquedas.",
        cta: "Registrarme gratis como profesional",
        ctaUrl: "/precios",
      },
      {
        q: "¿Qué incluye el Plan Visibilidad y el Plan Ads+?",
        a: "El Plan Visibilidad destaca tu perfil en los resultados de búsqueda y te da acceso a estadísticas de visitas. El Plan Ads+ incluye lo anterior y añade campañas publicitarias activas gestionadas por nuestro equipo, posicionamiento prioritario en tu zona y soporte dedicado. Ambos planes se pueden cancelar en cualquier momento.",
        cta: "Ver planes y precios",
        ctaUrl: "/precios",
      },
      {
        q: "¿Cómo se verifica a los autónomos en MisAutónomos?",
        a: "Verificamos a cada profesional comprobando su alta en el RETA, NIF/DNI, datos de contacto reales y, en oficios regulados, su titulación o licencia. Los perfiles verificados muestran un sello específico. Esto da seguridad al cliente y diferencia a los profesionales serios.",
        cta: "Verifica tu perfil",
        ctaUrl: "/mi-perfil",
      },
      {
        q: "¿Cómo recibo solicitudes de presupuesto en MisAutónomos?",
        a: "Cuando un cliente publica una necesidad en tu categoría y zona, te llega un aviso por email y a tu panel de la plataforma. Tú decides si quieres enviar presupuesto. Cuanto más completo esté tu perfil (foto, descripción, ejemplos de trabajo, valoraciones), más solicitudes recibirás. Los perfiles completos reciben hasta 5 veces más solicitudes.",
        cta: "Completa tu perfil ahora",
        ctaUrl: "/mi-perfil",
      },
    ],
  },
];

// Todas las FAQs aplanadas para el buscador y el schema
const ALL_FAQS = SECTIONS.flatMap(s => s.faqs.map(f => ({ ...f, sectionId: s.id, sectionLabel: s.label })));

// Schema JSON-LD FAQPage
function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": ALL_FAQS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a,
      },
    })),
  };

  useEffect(() => {
    let script = document.getElementById("faq-schema-jsonld");
    if (!script) {
      script = document.createElement("script");
      script.id = "faq-schema-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
    return () => { if (script) script.remove(); };
  }, []);

  return null;
}

// Acordeón individual
function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isOpen ? "border-blue-200 shadow-sm" : "border-gray-200"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className={`font-semibold text-base pr-4 ${isOpen ? "text-blue-900" : "text-gray-900"}`}>
          {faq.q}
        </span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-blue-100 pt-4">
          <p className="text-gray-600 leading-relaxed mb-4">{faq.a}</p>
          <Link
            to={faq.ctaUrl}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {faq.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("autonomos");
  const [openIndex, setOpenIndex] = useState(null);

  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) return null; // null = mostrar por secciones
    const lower = searchTerm.toLowerCase();
    return ALL_FAQS.filter(f => f.q.toLowerCase().includes(lower) || f.a.toLowerCase().includes(lower));
  }, [searchTerm]);

  const activeSectionData = SECTIONS.find(s => s.id === activeSection);

  return (
    <>
      <SEOHead
        title="Preguntas frecuentes sobre autónomos en España | MisAutónomos"
        description="Resuelve tus dudas sobre cómo darte de alta como autónomo, contratar profesionales, cuotas, facturación y mucho más. Guía actualizada 2026."
        keywords="preguntas frecuentes autónomos, alta autónomo España, cuota autónomos 2026, impuestos autónomo, tarifa plana autónomos, contratar autónomo"
      />
      <FAQSchema />

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* ── Hero ── */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-blue-600/50 text-blue-100 border-blue-500/40 text-sm font-medium">
              Guía actualizada 2026
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Preguntas frecuentes
            </h1>
            <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
              Resuelve tus dudas sobre autónomos en España: altas, impuestos, cuotas y cómo encontrar el profesional ideal.
            </p>

            {/* Buscador */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setOpenIndex(null); }}
                placeholder="Busca tu pregunta..."
                className="pl-12 h-13 text-base bg-white text-gray-900 border-0 shadow-lg rounded-xl py-3.5"
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Resultados de búsqueda */}
          {filteredFaqs ? (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                {filteredFaqs.length} resultado{filteredFaqs.length !== 1 ? "s" : ""} para «{searchTerm}»
              </p>
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No encontramos resultados</p>
                  <p className="text-sm mt-1">Prueba con otras palabras</p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-4 text-blue-600 text-sm font-semibold hover:underline"
                  >
                    Ver todas las preguntas
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFaqs.map((faq, i) => (
                    <FAQItem
                      key={i}
                      faq={faq}
                      isOpen={openIndex === i}
                      onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tabs de sección */}
              <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1">
                {SECTIONS.map(s => {
                  const Icon = s.icon;
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setActiveSection(s.id); setOpenIndex(null); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Preguntas de la sección activa */}
              {activeSectionData && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 ${activeSectionData.color} rounded-xl flex items-center justify-center`}>
                      <activeSectionData.icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{activeSectionData.label}</h2>
                    <span className="ml-auto text-sm text-gray-400">{activeSectionData.faqs.length} preguntas</span>
                  </div>

                  <div className="space-y-3">
                    {activeSectionData.faqs.map((faq, i) => (
                      <FAQItem
                        key={i}
                        faq={faq}
                        isOpen={openIndex === i}
                        onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── CTA final ── */}
          <div className="mt-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">¿No encuentras tu respuesta?</h2>
            <p className="text-blue-200 mb-6">Habla directamente con un profesional de tu zona o contáctanos.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/buscar"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Buscar profesional <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/precios"
                className="inline-flex items-center justify-center gap-2 bg-blue-500/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-500/60 transition-colors border border-blue-400/30"
              >
                Ver planes y precios
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}