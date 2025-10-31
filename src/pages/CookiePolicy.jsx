import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Cookie } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Search")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <Cookie className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Política de Cookies
              </h1>
            </div>
            
            <p className="text-gray-600 mb-8">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
            </p>

            <div className="space-y-8 text-gray-700">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. ¿Qué son las cookies?</h2>
                <p className="leading-relaxed">
                  Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. 
                  Se utilizan ampliamente para que los sitios web funcionen de manera más eficiente y para proporcionar información a los propietarios del sitio.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. ¿Qué cookies utilizamos?</h2>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Cookies Estrictamente Necesarias</h3>
                    <p className="leading-relaxed mb-2">
                      Estas cookies son esenciales para que puedas navegar por el sitio web y utilizar sus funciones. <strong>No se pueden desactivar.</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><code>session_id</code> - Mantiene tu sesión activa</li>
                      <li><code>auth_token</code> - Gestiona tu autenticación</li>
                      <li><code>csrf_token</code> - Protección contra ataques</li>
                      <li><code>cookies_accepted</code> - Recuerda tu preferencia de cookies</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Cookies de Funcionalidad</h3>
                    <p className="leading-relaxed mb-2">
                      Estas cookies permiten que el sitio web recuerde las opciones que has elegido.
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><code>language</code> - Recuerda tu idioma preferido (ES/EN)</li>
                      <li><code>user_preferences</code> - Guarda tus preferencias de visualización</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Cookies de Análisis</h3>
                    <p className="leading-relaxed mb-2">
                      Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><code>_ga</code> - Google Analytics (identificador único de usuario)</li>
                      <li><code>_gid</code> - Google Analytics (identificador de sesión)</li>
                      <li><code>_gat</code> - Google Analytics (limitación de tasa de solicitudes)</li>
                    </ul>
                    <p className="text-sm mt-2 italic">
                      Duración: Hasta 2 años. Puedes rechazarlas en el banner de cookies.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Cookies de Terceros</h3>
                    <p className="leading-relaxed mb-2">
                      Utilizamos servicios de terceros que pueden establecer cookies:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><strong>Stripe:</strong> Para procesar pagos de forma segura</li>
                      <li><strong>Google Maps:</strong> Para mostrar mapas de ubicación</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. ¿Para qué utilizamos las cookies?</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Autenticación:</strong> Para mantener tu sesión iniciada</li>
                  <li><strong>Seguridad:</strong> Para proteger tu cuenta y prevenir fraudes</li>
                  <li><strong>Preferencias:</strong> Para recordar tu idioma y configuración</li>
                  <li><strong>Análisis:</strong> Para entender cómo usas la plataforma y mejorarla</li>
                  <li><strong>Funcionalidad:</strong> Para que todas las características funcionen correctamente</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. ¿Cómo puedes gestionar las cookies?</h2>
                <p className="leading-relaxed mb-4">
                  Tienes varias opciones para gestionar las cookies:
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">A través de nuestro banner</h3>
                    <p className="text-sm leading-relaxed">
                      Cuando visitas MilAutónomos por primera vez, te mostramos un banner donde puedes elegir entre:
                    </p>
                    <ul className="list-disc pl-6 text-sm mt-2 space-y-1">
                      <li><strong>"Solo necesarias":</strong> Solo cookies esenciales</li>
                      <li><strong>"Aceptar todas":</strong> Todas las cookies (necesarias + funcionalidad + análisis)</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">A través de tu navegador</h3>
                    <p className="text-sm leading-relaxed mb-2">
                      Puedes configurar tu navegador para rechazar cookies:
                    </p>
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                      <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                      <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
                      <li><strong>Edge:</strong> Configuración → Privacidad → Cookies</li>
                    </ul>
                  </div>
                </div>

                <p className="mt-4 text-sm italic text-gray-600">
                  ⚠️ Ten en cuenta que rechazar algunas cookies puede afectar al funcionamiento de la plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Duración de las cookies</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Cookies de sesión</h3>
                    <p className="text-sm text-gray-700">Se eliminan cuando cierras el navegador</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Cookies persistentes</h3>
                    <p className="text-sm text-gray-700">Permanecen en tu dispositivo durante un tiempo específico:</p>
                    <ul className="list-disc pl-6 text-sm mt-1">
                      <li>Preferencias de idioma: 1 año</li>
                      <li>Cookies de análisis: hasta 2 años</li>
                      <li>Consentimiento de cookies: 1 año</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Actualizaciones de esta política</h2>
                <p className="leading-relaxed">
                  Podemos actualizar esta Política de Cookies periódicamente para reflejar cambios en las cookies que utilizamos o por razones legales. 
                  Te recomendamos revisar esta página regularmente para estar informado.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Más información</h2>
                <p className="leading-relaxed mb-4">
                  Para más información sobre cómo protegemos tu privacidad, consulta nuestra{" "}
                  <Link to={createPageUrl("PrivacyPolicy")} className="text-blue-600 hover:underline">
                    Política de Privacidad
                  </Link>.
                </p>
                <p className="leading-relaxed">
                  Si tienes preguntas sobre nuestro uso de cookies, contacta con:
                </p>
                <ul className="list-none pl-0 mt-4 space-y-2">
                  <li>📧 Email: <a href="mailto:privacidad@milautonomos.com" className="text-blue-600 hover:underline">privacidad@milautonomos.com</a></li>
                  <li>📞 Teléfono: +34 900 123 456</li>
                </ul>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}