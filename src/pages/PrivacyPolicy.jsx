
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
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
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Política de Privacidad
              </h1>
            </div>
            
            <p className="text-gray-600 mb-8">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
            </p>

            <div className="space-y-8 text-gray-700">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Responsable del tratamiento</h2>
                <p className="leading-relaxed">
                  <strong>Misautónomos</strong> es el responsable del tratamiento de los datos personales que nos facilites. 
                  Nos comprometemos a proteger tu privacidad y a cumplir con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos (LOPD).
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Dirección: Madrid, España</li>
                  <li>Email: administrador@autonomosmil.es</li>
                  <li>Teléfono: +34 900 123 456</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Datos que recopilamos</h2>
                <p className="leading-relaxed mb-4">Recopilamos la siguiente información:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Datos de identificación:</strong> nombre, apellidos, email, teléfono</li>
                  <li><strong>Datos de perfil profesional:</strong> CIF/NIF, nombre comercial, categorías de servicio, ubicación, fotos de trabajos</li>
                  <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas</li>
                  <li><strong>Datos de pago:</strong> información de tarjeta (gestionada por Stripe, no almacenamos datos bancarios)</li>
                  <li><strong>Mensajes y comunicaciones:</strong> conversaciones con otros usuarios dentro de la plataforma</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Finalidad del tratamiento</h2>
                <p className="leading-relaxed mb-4">Utilizamos tus datos para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Crear y gestionar tu cuenta de usuario</li>
                  <li>Facilitar la conexión entre clientes y profesionales</li>
                  <li>Procesar pagos y gestionar suscripciones</li>
                  <li>Enviar comunicaciones relacionadas con el servicio</li>
                  <li>Mejorar nuestros servicios mediante análisis de uso</li>
                  <li>Cumplir con obligaciones legales</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base legal del tratamiento</h2>
                <p className="leading-relaxed">
                  El tratamiento de tus datos se basa en:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li><strong>Ejecución de contrato:</strong> para prestarte los servicios de la plataforma</li>
                  <li><strong>Consentimiento:</strong> para comunicaciones comerciales y cookies no esenciales</li>
                  <li><strong>Interés legítimo:</strong> para mejorar nuestros servicios y prevenir fraudes</li>
                  <li><strong>Obligación legal:</strong> para cumplir con requisitos fiscales y legales</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Compartir datos con terceros</h2>
                <p className="leading-relaxed mb-4">
                  Podemos compartir tus datos con:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Stripe:</strong> para procesar pagos de forma segura</li>
                  <li><strong>Proveedores de hosting:</strong> para almacenar datos en servidores seguros</li>
                  <li><strong>Servicios de análisis:</strong> para mejorar la plataforma (datos anonimizados)</li>
                  <li><strong>Autoridades competentes:</strong> cuando sea requerido por ley</li>
                </ul>
                <p className="mt-4 leading-relaxed">
                  <strong>NUNCA</strong> vendemos tus datos a terceros con fines publicitarios.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Tus derechos</h2>
                <p className="leading-relaxed mb-4">
                  Tienes derecho a:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Acceso:</strong> solicitar una copia de tus datos personales</li>
                  <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
                  <li><strong>Supresión:</strong> solicitar la eliminación de tus datos</li>
                  <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos</li>
                  <li><strong>Limitación:</strong> solicitar la limitación del tratamiento</li>
                  <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado</li>
                  <li><strong>Retirar consentimiento:</strong> en cualquier momento</li>
                </ul>
                <p className="mt-4 leading-relaxed">
                  Para ejercer tus derechos, contacta con: <a href="mailto:administrador@autonomosmil.es" className="text-blue-600 hover:underline">administrador@autonomosmil.es</a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Conservación de datos</h2>
                <p className="leading-relaxed">
                  Conservamos tus datos mientras:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Mantengas tu cuenta activa</li>
                  <li>Sea necesario para cumplir con obligaciones legales (6 años para datos fiscales)</li>
                  <li>Haya una relación contractual vigente</li>
                </ul>
                <p className="mt-4 leading-relaxed">
                  Tras la cancelación de tu cuenta, eliminaremos tus datos en un plazo de 30 días, salvo obligación legal de conservación.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Seguridad</h2>
                <p className="leading-relaxed">
                  Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra acceso no autorizado, pérdida o destrucción, incluyendo:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Cifrado SSL/TLS en todas las comunicaciones</li>
                  <li>Servidores seguros con copias de seguridad periódicas</li>
                  <li>Acceso restringido a datos personales</li>
                  <li>Contraseñas cifradas</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies</h2>
                <p className="leading-relaxed">
                  Utilizamos cookies para mejorar tu experiencia. Consulta nuestra{" "}
                  <Link to={createPageUrl("CookiePolicy")} className="text-blue-600 hover:underline">
                    Política de Cookies
                  </Link>{" "}
                  para más información.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cambios en esta política</h2>
                <p className="leading-relaxed">
                  Podemos actualizar esta política periódicamente. Te notificaremos de cambios significativos por email o mediante un aviso en la plataforma. La fecha de la última actualización aparece al inicio de este documento.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contacto</h2>
                <p className="leading-relaxed">
                  Para cualquier duda sobre esta política de privacidad, contacta con:
                </p>
                <ul className="list-none pl-0 mt-4 space-y-2">
                  <li>📧 Email: <a href="mailto:administrador@autonomosmil.es" className="text-blue-600 hover:underline">administrador@autonomosmil.es</a></li>
                  <li>📞 Teléfono: +34 900 123 456</li>
                  <li>📍 Dirección: Madrid, España</li>
                </ul>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
