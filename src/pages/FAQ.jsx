import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronDown, ChevronUp, ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const faqs = [
    {
      category: "Para Clientes",
      questions: [
        {
          q: "¿Es gratis usar MilAutónomos como cliente?",
          a: "Sí, usar MilAutónomos es completamente gratuito para clientes. Puedes buscar profesionales, contactarlos y dejar valoraciones sin ningún coste."
        },
        {
          q: "¿Cómo busco un profesional?",
          a: "Ve a la página de búsqueda, usa los filtros (categoría, provincia, ciudad) y navega por los perfiles disponibles. Puedes ver valoraciones, fotos de trabajos y contactar directamente."
        },
        {
          q: "¿Cómo contacto con un autónomo?",
          a: "En cada perfil encontrarás botones para llamar por teléfono, enviar WhatsApp o usar nuestro chat interno. Elige el método que prefieras."
        },
        {
          q: "¿Cómo dejo una valoración?",
          a: "Después de contratar un servicio, ve al perfil del profesional y haz clic en 'Dejar valoración'. Necesitas tener una conversación previa con el profesional para poder valorarlo."
        },
        {
          q: "¿Puedo guardar profesionales como favoritos?",
          a: "Sí, haz clic en el corazón ❤️ en cualquier tarjeta de perfil para guardarlo en tus favoritos. Podrás acceder a ellos desde tu menú de usuario."
        }
      ]
    },
    {
      category: "Para Profesionales",
      questions: [
        {
          q: "¿Cómo me doy de alta como profesional?",
          a: "Haz clic en 'Hazte Autónomo', elige un plan (prueba gratis de 7 días disponible), completa tu perfil profesional y empieza a recibir contactos de clientes."
        },
        {
          q: "¿Qué incluyen los planes?",
          a: "Todos los planes incluyen: perfil completo, aparecer en búsquedas, chat con clientes, galería de fotos ilimitada y valoraciones. Los planes trimestrales y anuales incluyen perfil destacado."
        },
        {
          q: "¿Qué es un perfil destacado?",
          a: "Los perfiles destacados aparecen en las primeras posiciones de las búsquedas con un badge especial, aumentando tu visibilidad y probabilidad de recibir contactos."
        },
        {
          q: "¿Puedo cambiar de plan?",
          a: "Sí, puedes cambiar de plan en cualquier momento desde tu panel 'Mi Suscripción'. Los cambios se aplicarán en el siguiente ciclo de facturación."
        },
        {
          q: "¿Cómo cancelo mi suscripción?",
          a: "Ve a 'Mi Suscripción' y haz clic en 'Cancelar suscripción'. Seguirás teniendo acceso hasta el final del periodo pagado."
        },
        {
          q: "¿Cómo completo mi perfil?",
          a: "Después de suscribirte, completa el quiz de onboarding con: datos de contacto, categorías de servicio, zona de trabajo, horarios, tarifas y fotos de tus trabajos."
        }
      ]
    },
    {
      category: "Facturación y Pagos",
      questions: [
        {
          q: "¿Qué métodos de pago aceptan?",
          a: "Aceptamos pagos con tarjeta de crédito/débito a través de Stripe, una plataforma segura y confiable."
        },
        {
          q: "¿Cuándo se cobra la suscripción?",
          a: "Plan mensual: cada mes. Plan trimestral: cada 3 meses. Plan anual: cada año. El cobro se realiza automáticamente el mismo día de tu alta."
        },
        {
          q: "¿Qué pasa con la prueba gratuita?",
          a: "La prueba de 7 días es gratuita, pero requiere tarjeta. Si no cancelas antes de que termine, se cobrará automáticamente el plan mensual (49€/mes)."
        },
        {
          q: "¿Puedo obtener factura?",
          a: "Sí, recibirás una factura automática por email después de cada pago. También puedes descargarlas desde tu panel de usuario."
        },
        {
          q: "¿Hay reembolsos?",
          a: "Los pagos son no reembolsables. Si cancelas, mantendrás el acceso hasta el final del periodo pagado."
        }
      ]
    },
    {
      category: "Cuenta y Seguridad",
      questions: [
        {
          q: "¿Cómo cambio mi contraseña?",
          a: "Ve a 'Mi Perfil' > 'Configuración' > 'Cambiar contraseña'. Introduce tu contraseña actual y la nueva."
        },
        {
          q: "¿Cómo actualizo mi información?",
          a: "Clientes: ve a 'Mi Perfil'. Profesionales: ve a 'Mi Perfil' y edita tu perfil profesional completo."
        },
        {
          q: "¿Cómo elimino mi cuenta?",
          a: "Contacta con soporte en soporte@milautonomos.com. Ten en cuenta que esta acción es irreversible."
        },
        {
          q: "¿Son seguros mis datos?",
          a: "Sí, usamos cifrado SSL y cumplimos con el RGPD. Tus datos están protegidos y nunca los compartimos con terceros sin tu consentimiento."
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      faq =>
        faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Search")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Encuentra respuestas rápidas a las dudas más comunes
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar en preguntas frecuentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {filteredFaqs.map((category, catIdx) => (
          <div key={catIdx} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {category.category}
            </h2>
            <div className="space-y-3">
              {category.questions.map((faq, idx) => {
                const globalIdx = `${catIdx}-${idx}`;
                const isOpen = openIndex === globalIdx;

                return (
                  <Card key={idx} className="border-0 shadow-md overflow-hidden">
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                      className="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                    >
                      <span className="font-semibold text-gray-900 flex-1">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <CardContent className="px-6 pb-6 pt-0">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.a}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {filteredFaqs.length === 0 && (
          <Card className="border-0 shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">
              No se encontraron preguntas que coincidan con tu búsqueda
            </p>
            <Button onClick={() => setSearchTerm("")}>
              Ver todas las preguntas
            </Button>
          </Card>
        )}

        <Card className="border-0 shadow-lg bg-blue-50 mt-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ¿No encuentras tu respuesta?
            </h3>
            <p className="text-gray-700 mb-6">
              Nuestro equipo de soporte está listo para ayudarte
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl("HelpCenter")}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Centro de Ayuda
                </Button>
              </Link>
              <a href="mailto:soporte@milautonomos.com">
                <Button variant="outline" size="lg">
                  Contactar Soporte
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}