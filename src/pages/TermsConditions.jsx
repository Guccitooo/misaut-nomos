import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsConditionsPage() {
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
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Términos y Condiciones
              </h1>
            </div>
            
            <p className="text-gray-600 mb-8">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
            </p>

            <div className="space-y-8 text-gray-700">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceptación de los términos</h2>
                <p className="leading-relaxed">
                  Al acceder y utilizar MilAutónomos, aceptas estar vinculado por estos Términos y Condiciones. 
                  Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestros servicios.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descripción del servicio</h2>
                <p className="leading-relaxed mb-4">
                  MilAutónomos es una plataforma digital que conecta clientes con profesionales autónomos en España. Ofrecemos:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Para clientes:</strong> búsqueda gratuita de profesionales, contacto directo, sistema de valoraciones</li>
                  <li><strong>Para profesionales:</strong> creación de perfil, visibilidad en búsquedas, recepción de contactos, gestión de servicios</li>
                </ul>
                <p className="mt-4 leading-relaxed">
                  MilAutónomos actúa únicamente como intermediario. No somos parte de ninguna relación contractual entre clientes y profesionales.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Registro y cuenta de usuario</h2>
                <p className="leading-relaxed mb-4">
                  Para utilizar ciertos servicios, debes crear una cuenta. Te comprometes a:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Proporcionar información veraz, actual y completa</li>
                  <li>Mantener la seguridad de tu contraseña</li>
                  <li>Notificar inmediatamente cualquier uso no autorizado de tu cuenta</li>
                  <li>Ser responsable de toda actividad que ocurra bajo tu cuenta</li>
                  <li>Tener al menos 18 años de edad</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Obligaciones de los profesionales</h2>
                <p className="leading-relaxed mb-4">
                  Los profesionales se comprometen a:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Proporcionar información veraz sobre sus servicios y cualificaciones</li>
                  <li>Cumplir con todas las obligaciones fiscales y legales aplicables</li>
                  <li>Mantener su perfil actualizado</li>
                  <li>Responder a las solicitudes de los clientes de manera profesional</li>
                  <li>Cumplir con los servicios acordados con los clientes</li>
                  <li>Mantener activa su suscripción para permanecer visible</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Obligaciones de los clientes</h2>
                <p className="leading-relaxed mb-4">
                  Los clientes se comprometen a:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Utilizar la plataforma de buena fe</li>
                  <li>Proporcionar valoraciones honestas y constructivas</li>
                  <li>No acosar ni discriminar a los profesionales</li>
                  <li>Respetar los acuerdos establecidos con los profesionales</li>
                  <li>No utilizar la plataforma para fines ilícitos</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Suscripciones y pagos</h2>
                <p className="leading-relaxed mb-4">
                  <strong>Para profesionales:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Los planes de suscripción son renovables automáticamente</li>
                  <li>Los pagos se procesan a través de Stripe</li>
                  <li>Los precios están sujetos a cambios con 30 días de aviso previo</li>
                  <li>Las suscripciones no son reembolsables</li>
                  <li>Puedes cancelar en cualquier momento, manteniendo acceso hasta el final del periodo pagado</li>
                  <li>La prueba gratuita requiere tarjeta y se convierte en plan de pago si no se cancela</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contenido del usuario</h2>
                <p className="leading-relaxed mb-4">
                  Al publicar contenido en MilAutónomos (fotos, descripciones, valoraciones):
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Conservas todos los derechos sobre tu contenido</li>
                  <li>Nos otorgas una licencia para mostrar ese contenido en la plataforma</li>
                  <li>Garantizas que tienes los derechos necesarios sobre el contenido</li>
                  <li>No publicarás contenido ilegal, ofensivo, difamatorio o que infrinja derechos de terceros</li>
                  <li>Nos reservamos el derecho de eliminar contenido inapropiado</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Propiedad intelectual</h2>
                <p className="leading-relaxed">
                  Todos los derechos de propiedad intelectual sobre la plataforma, incluyendo diseño, código, marca y contenido original, pertenecen a MilAutónomos. 
                  No puedes copiar, reproducir o distribuir ningún elemento de la plataforma sin nuestro consentimiento expreso.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitación de responsabilidad</h2>
                <p className="leading-relaxed mb-4">
                  MilAutónomos no es responsable de:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>La calidad, legalidad o veracidad de los servicios ofrecidos por los profesionales</li>
                  <li>Las relaciones contractuales entre clientes y profesionales</li>
                  <li>Daños derivados del uso o imposibilidad de uso de la plataforma</li>
                  <li>Pérdidas de beneficios o datos</li>
                  <li>Comportamiento de otros usuarios</li>
                </ul>
                <p className="mt-4 leading-relaxed">
                  Los profesionales son contratistas independientes. MilAutónomos no supervisa ni garantiza sus servicios.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Suspensión y terminación</h2>
                <p className="leading-relaxed mb-4">
                  Nos reservamos el derecho de suspender o terminar tu cuenta si:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violas estos Términos y Condiciones</li>
                  <li>Proporcionas información falsa</li>
                  <li>Realizas actividades fraudulentas</li>
                  <li>Acosas o perjudicas a otros usuarios</li>
                  <li>Utilizas la plataforma para fines ilícitos</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modificaciones</h2>
                <p className="leading-relaxed">
                  Podemos modificar estos términos en cualquier momento. Te notificaremos de cambios significativos por email o mediante aviso en la plataforma. 
                  El uso continuado de la plataforma tras la publicación de cambios constituye tu aceptación de los mismos.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Legislación aplicable</h2>
                <p className="leading-relaxed">
                  Estos términos se rigen por la legislación española. Cualquier disputa se resolverá en los tribunales de Madrid, España.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contacto</h2>
                <p className="leading-relaxed">
                  Para cualquier duda sobre estos términos:
                </p>
                <ul className="list-none pl-0 mt-4 space-y-2">
                  <li>📧 Email: <a href="mailto:legal@milautonomos.com" className="text-blue-600 hover:underline">legal@milautonomos.com</a></li>
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