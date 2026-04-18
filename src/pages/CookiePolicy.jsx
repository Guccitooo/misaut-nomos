import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cookie, Settings } from "lucide-react";
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
          text: "Utilizamos los siguientes tipos de cookies:",
          hasTable: true,
          tableData: {
            essential: [
              { name: "session", provider: "MisAutónomos", purpose: "Mantener sesión iniciada", duration: "Sesión" },
              { name: "language", provider: "MisAutónomos", purpose: "Recordar idioma seleccionado", duration: "1 año" },
              { name: "cookie_consent", provider: "MisAutónomos", purpose: "Guardar preferencias de cookies", duration: "1 año" },
              { name: "consent_id", provider: "MisAutónomos", purpose: "ID único de consentimiento RGPD", duration: "1 año" },
              { name: "sessionStorage", provider: "MisAutónomos", purpose: "Cache de usuario y consentimientos", duration: "Sesión" }
            ],
            analytics: [
              { name: "_ga", provider: "Google Analytics", purpose: "Distinguir usuarios únicos", duration: "2 años" },
              { name: "_gid", provider: "Google Analytics", purpose: "Identificar sesión de usuario", duration: "24 horas" },
              { name: "_gat", provider: "Google Analytics", purpose: "Throttle de requisiciones a GA", duration: "1 minuto" },
              { name: "_ga_*", provider: "Google Analytics", purpose: "Persistencia de sesión y eventos", duration: "2 años" }
            ],
            marketing: [
              { name: "_fbp", provider: "Meta", purpose: "Publicidad personalizada en Facebook/Instagram", duration: "3 meses" },
              { name: "fr", provider: "Meta", purpose: "Contener lista de IDs de usuario de Meta", duration: "3 meses" }
            ]
          }
        },
        {
          title: "3. Base Legal (RGPD + LSSI-CE)",
          text: "El uso de cookies en MisAutónomos cumple con: • RGPD (Reglamento 2016/679): consentimiento previo para cookies no esenciales • LSSI-CE (Ley 34/2002): información clara y derecho a rechazar • Requisito de consentimiento antes de cargar scripts de terceros • Derecho a retirar consentimiento en cualquier momento"
        },
        {
          title: "4. Cómo Gestionar las Cookies",
          text: "Puede gestionar las cookies de dos formas:",
          subtext: "1. Mediante nuestro banner de cookies al entrar al sitio (botones: Rechazar, Personalizar, Aceptar todas)\n2. Desde la página de Preferencias de Cookies (accesible en cualquier momento)\n3. Configurando su navegador para bloquear o eliminar cookies"
        },
        {
          title: "5. Derecho a Retirar el Consentimiento",
          text: "Puede cambiar o retirar su consentimiento en cualquier momento accediendo a la página de Preferencias de Cookies. Si retira el consentimiento para analíticas, se eliminarán las cookies _ga* asociadas."
        },
        {
          title: "6. Cookies de Terceros",
          text: "Utilizamos servicios de terceros que pueden establecer cookies: Google Analytics (análisis - solo si consiente), Stripe (pagos - esencial), OneSignal (notificaciones - solo si se suscribe)"
        },
        {
          title: "7. Duración de las Cookies",
          text: "• Cookies de sesión: se eliminan al cerrar el navegador\n• Cookies persistentes: se mantienen entre 30 días y 2 años según su propósito\n• Puede verificar la duración exacta en las tablas anteriores"
        },
        {
          title: "8. Contacto y Derechos RGPD",
          text: "Para consultas sobre cookies, privacidad o para ejercer sus derechos RGPD (acceso, rectificación, supresión, portabilidad): hola@misautonomos.com"
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
          text: "We use the following types of cookies:",
          hasTable: true,
          tableData: {
            essential: [
              { name: "session", provider: "MisAutónomos", purpose: "Keep session logged in", duration: "Session" },
              { name: "language", provider: "MisAutónomos", purpose: "Remember selected language", duration: "1 year" },
              { name: "cookie_consent", provider: "MisAutónomos", purpose: "Store cookie preferences", duration: "1 year" },
              { name: "consent_id", provider: "MisAutónomos", purpose: "Unique GDPR consent ID", duration: "1 year" },
              { name: "sessionStorage", provider: "MisAutónomos", purpose: "User cache and consent records", duration: "Session" }
            ],
            analytics: [
              { name: "_ga", provider: "Google Analytics", purpose: "Distinguish unique users", duration: "2 years" },
              { name: "_gid", provider: "Google Analytics", purpose: "Identify user session", duration: "24 hours" },
              { name: "_gat", provider: "Google Analytics", purpose: "Throttle requests to GA", duration: "1 minute" },
              { name: "_ga_*", provider: "Google Analytics", purpose: "Session persistence and events", duration: "2 years" }
            ],
            marketing: [
              { name: "_fbp", provider: "Meta", purpose: "Personalized ads on Facebook/Instagram", duration: "3 months" },
              { name: "fr", provider: "Meta", purpose: "Contain Meta user ID list", duration: "3 months" }
            ]
          }
        },
        {
          title: "3. Legal Basis (GDPR + LSSI-CE)",
          text: "Cookie usage in MisAutónomos complies with: • GDPR (Regulation 2016/679): prior consent for non-essential cookies • LSSI-CE (Law 34/2002): clear information and right to refuse • Requirement to obtain consent before loading third-party scripts • Right to withdraw consent at any time"
        },
        {
          title: "4. How to Manage Cookies",
          text: "You can manage cookies in multiple ways:",
          subtext: "1. Through our cookie banner when entering the site (buttons: Reject, Customize, Accept All)\n2. From the Cookie Preferences page (accessible at any time)\n3. Configuring your browser to block or delete cookies"
        },
        {
          title: "5. Right to Withdraw Consent",
          text: "You can change or withdraw your consent at any time by accessing the Cookie Preferences page. If you withdraw consent for analytics, associated _ga* cookies will be deleted."
        },
        {
          title: "6. Third-Party Cookies",
          text: "We use third-party services that may set cookies: Google Analytics (analytics - only if you consent), Stripe (payments - essential), OneSignal (notifications - only if subscribed)"
        },
        {
          title: "7. Cookie Duration",
          text: "• Session cookies: deleted when closing browser\n• Persistent cookies: maintained between 30 days and 2 years depending on their purpose\n• See the detailed tables above for exact durations"
        },
        {
          title: "8. Contact and GDPR Rights",
          text: "For inquiries about cookies, privacy, or to exercise your GDPR rights (access, rectification, deletion, portability): hola@misautonomos.com"
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
            <CardContent className="p-8 space-y-8">
              {currentContent.sections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.text}</p>
                  
                  {section.hasTable && section.tableData && (
                    <div className="mt-4 space-y-4">
                      {section.tableData.essential && (
                        <div className="overflow-x-auto">
                          <h4 className="font-semibold text-gray-900 text-sm mb-2">
                            {language === 'es' ? 'Cookies Esenciales' : 'Essential Cookies'}
                          </h4>
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-gray-100 border border-gray-200">
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Nombre' : 'Name'}
                                </th>
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Proveedor' : 'Provider'}
                                </th>
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Finalidad' : 'Purpose'}
                                </th>
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Duración' : 'Duration'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.tableData.essential.map((row, i) => (
                                <tr key={i} className="border border-gray-200 hover:bg-gray-50">
                                  <td className="p-2 text-gray-700 font-mono text-xs">{row.name}</td>
                                  <td className="p-2 text-gray-700 text-sm">{row.provider}</td>
                                  <td className="p-2 text-gray-700 text-sm">{row.purpose}</td>
                                  <td className="p-2 text-gray-700 text-sm">{row.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {section.tableData.analytics && (
                        <div className="overflow-x-auto">
                          <h4 className="font-semibold text-gray-900 text-sm mb-2">
                            {language === 'es' ? 'Cookies Analíticas (Opcionales)' : 'Analytics Cookies (Optional)'}
                          </h4>
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-gray-100 border border-gray-200">
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Nombre' : 'Name'}
                                </th>
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Proveedor' : 'Provider'}
                                </th>
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Finalidad' : 'Purpose'}
                                </th>
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Duración' : 'Duration'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.tableData.analytics.map((row, i) => (
                                <tr key={i} className="border border-gray-200 hover:bg-gray-50">
                                  <td className="p-2 text-gray-700 font-mono text-xs">{row.name}</td>
                                  <td className="p-2 text-gray-700 text-sm">{row.provider}</td>
                                  <td className="p-2 text-gray-700 text-sm">{row.purpose}</td>
                                  <td className="p-2 text-gray-700 text-sm">{row.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {section.tableData.marketing && (
                        <div className="overflow-x-auto">
                          <h4 className="font-semibold text-gray-900 text-sm mb-2">
                            {language === 'es' ? 'Cookies de Marketing (Opcionales)' : 'Marketing Cookies (Optional)'}
                          </h4>
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-gray-100 border border-gray-200">
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Nombre' : 'Name'}
                                </th>
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Proveedor' : 'Provider'}
                                </th>
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Finalidad' : 'Purpose'}
                                </th>
                                <th className="p-2 text-left font-semibold text-gray-900">
                                  {language === 'es' ? 'Duración' : 'Duration'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.tableData.marketing.map((row, i) => (
                                <tr key={i} className="border border-gray-200 hover:bg-gray-50">
                                  <td className="p-2 text-gray-700 font-mono text-xs">{row.name}</td>
                                  <td className="p-2 text-gray-700 text-sm">{row.provider}</td>
                                  <td className="p-2 text-gray-700 text-sm">{row.purpose}</td>
                                  <td className="p-2 text-gray-700 text-sm">{row.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-12 space-y-4">
                <div className="p-6 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
                  <p className="text-sm text-gray-800 font-medium">
                    {language === 'es' 
                      ? 'Para consultas sobre cookies' 
                      : 'For cookie inquiries'}: 
                    <a href="mailto:hola@misautonomos.com" className="text-blue-600 hover:text-blue-800 ml-1 font-semibold">
                      hola@misautonomos.com
                    </a>
                  </p>
                </div>
                
                <Link to="/configuracion-cookies" className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                  {language === 'es' ? 'Ir a Preferencias de Cookies' : 'Go to Cookie Preferences'}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}