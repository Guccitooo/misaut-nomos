import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cookie } from "lucide-react";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";

export default function CookiePolicyPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const content = {
    es: {
      title: "Política de Cookies",
      subtitle: "Última actualización: 15 de enero de 2025",
      sections: [
        {
          title: "1. ¿Qué son las Cookies?",
          text: "Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Nos ayudan a mejorar su experiencia, recordar sus preferencias y analizar cómo usa nuestra plataforma."
        },
        {
          title: "2. Cookies que Utilizamos",
          text: "Utilizamos los siguientes tipos de cookies:"
        },
        {
          title: "2.1 Cookies Necesarias",
          text: "Esenciales para el funcionamiento de la plataforma. Incluyen: autenticación, sesión de usuario, preferencias de idioma, consentimiento de cookies. Estas cookies no pueden desactivarse."
        },
        {
          title: "2.2 Cookies de Funcionalidad",
          text: "Mejoran su experiencia recordando sus preferencias: idioma seleccionado, filtros de búsqueda, configuración de visualización."
        },
        {
          title: "2.3 Cookies de Análisis",
          text: "Nos ayudan a entender cómo usa la plataforma mediante Google Analytics: páginas visitadas, tiempo de permanencia, interacciones, errores técnicos."
        },
        {
          title: "2.4 Cookies de Terceros",
          text: "Utilizamos servicios de terceros que pueden establecer cookies: Google Analytics (análisis), Stripe (pagos), Supabase (almacenamiento)."
        },
        {
          title: "3. Cómo Gestionar las Cookies",
          text: "Puede gestionar las cookies de dos formas: (a) Mediante nuestro banner de cookies al entrar al sitio, (b) Configurando su navegador para bloquear o eliminar cookies."
        },
        {
          title: "4. Duración de las Cookies",
          text: "Cookies de sesión: se eliminan al cerrar el navegador. Cookies persistentes: se mantienen entre 30 días y 1 año según su propósito."
        },
        {
          title: "5. Contacto",
          text: "Para consultas sobre cookies: soporte@misautonomos.es"
        }
      ]
    },
    en: {
      title: "Cookie Policy",
      subtitle: "Last updated: January 15, 2025",
      sections: [
        {
          title: "1. What are Cookies?",
          text: "Cookies are small text files stored on your device when you visit a website. They help us improve your experience, remember your preferences and analyze how you use our platform."
        },
        {
          title: "2. Cookies We Use",
          text: "We use the following types of cookies:"
        },
        {
          title: "2.1 Necessary Cookies",
          text: "Essential for platform operation. Include: authentication, user session, language preferences, cookie consent. These cookies cannot be disabled."
        },
        {
          title: "2.2 Functionality Cookies",
          text: "Enhance your experience by remembering your preferences: selected language, search filters, display settings."
        },
        {
          title: "2.3 Analytics Cookies",
          text: "Help us understand how you use the platform via Google Analytics: pages visited, time spent, interactions, technical errors."
        },
        {
          title: "2.4 Third-Party Cookies",
          text: "We use third-party services that may set cookies: Google Analytics (analytics), Stripe (payments), Supabase (storage)."
        },
        {
          title: "3. How to Manage Cookies",
          text: "You can manage cookies in two ways: (a) Through our cookie banner when entering the site, (b) Configuring your browser to block or delete cookies."
        },
        {
          title: "4. Cookie Duration",
          text: "Session cookies: deleted when closing browser. Persistent cookies: maintained between 30 days and 1 year depending on their purpose."
        },
        {
          title: "5. Contact",
          text: "For cookie inquiries: soporte@misautonomos.es"
        }
      ]
    }
  };

  const currentContent = content[language] || content.es;

  return (
    <>
      <SEOHead 
        title={`${currentContent.title} - MisAutónomos`}
        description="Información sobre las cookies que utilizamos en MisAutónomos"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Search"))}
            className="mb-6 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Button>

          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
              <div className="flex items-center gap-3 mb-2">
                <Cookie className="w-8 h-8" />
                <CardTitle className="text-3xl font-bold">{currentContent.title}</CardTitle>
              </div>
              <p className="text-blue-100">{currentContent.subtitle}</p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {currentContent.sections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                  <p className="text-gray-700 leading-relaxed">{section.text}</p>
                </div>
              ))}

              <div className="mt-12 p-6 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
                <p className="text-sm text-gray-800 font-medium">
                  {language === 'es' 
                    ? 'Para consultas sobre cookies' 
                    : 'For cookie inquiries'}: 
                  <a href="mailto:soporte@misautonomos.es" className="text-blue-600 hover:text-blue-800 ml-1 font-semibold">
                    soporte@misautonomos.es
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}