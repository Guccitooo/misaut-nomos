import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Scale } from "lucide-react";

export default function LegalNoticePage() {
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
              <Scale className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Aviso Legal
              </h1>
            </div>
            
            <p className="text-gray-600 mb-8">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
            </p>

            <div className="space-y-8 text-gray-700">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Datos identificativos</h2>
                <p className="leading-relaxed mb-4">
                  En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico, 
                  informamos de los siguientes datos:
                </p>
                <ul className="list-none pl-0 space-y-2">
                  <li><strong>Denominación social:</strong> MilAutónomos</li>
                  <li><strong>Domicilio social:</strong> Madrid, España</li>
                  <li><strong>CIF:</strong> B-12345678</li>
                  <li><strong>Email:</strong> legal@milautonomos.com</li>
                  <li><strong>Teléfono:</strong> +34 900 123 456</li>
                  <li><strong>Registro Mercantil:</strong> Madrid, Tomo XXXX, Folio XX, Hoja M-XXXXX</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Objeto</h2>
                <p className="leading-relaxed">
                  El presente aviso legal regula el uso y utilización del sitio web <strong>milautonomos.com</strong> (en adelante, "el Sitio Web"), 
                  del que es titular MilAutónomos.
                </p>
                <p className="leading-relaxed mt-4">
                  La navegación por el Sitio Web atribuye la condición de usuario del mismo e implica la aceptación plena y sin reservas de todas y cada una 
                  de las disposiciones incluidas en este Aviso Legal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Condiciones de uso</h2>
                <p className="leading-relaxed mb-4">
                  El usuario se compromete a:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Hacer un uso adecuado y lícito del Sitio Web</li>
                  <li>No utilizar el Sitio Web con fines fraudulentos o ilegales</li>
                  <li>No acceder a áreas restringidas sin autorización</li>
                  <li>No introducir virus, malware o cualquier código dañino</li>
                  <li>No realizar actividades de scraping o extracción masiva de datos</li>
                  <li>No suplantar la identidad de otros usuarios</li>
                  <li>Respetar los derechos de propiedad intelectual e industrial</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Propiedad intelectual e industrial</h2>
                <p className="leading-relaxed mb-4">
                  Todos los contenidos del Sitio Web (textos, imágenes, diseño, código fuente, logos, marcas, etc.) son propiedad de MilAutónomos 
                  o de terceros que han autorizado su uso.
                </p>
                <p className="leading-relaxed mb-4">
                  Quedan expresamente prohibidas la reproducción, distribución, comunicación pública y transformación de cualquier elemento del Sitio Web 
                  sin la autorización expresa del titular de los derechos correspondientes.
                </p>
                <p className="leading-relaxed">
                  El incumplimiento de estas prohibiciones puede constituir una infracción sancionable por la legislación vigente.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Exclusión de responsabilidades</h2>
                <p className="leading-relaxed mb-4">
                  MilAutónomos no se hace responsable de:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>La calidad, veracidad o legalidad de los servicios ofrecidos por los profesionales registrados</li>
                  <li>Las relaciones contractuales entre usuarios (clientes y profesionales)</li>
                  <li>Los daños derivados del mal uso del Sitio Web por parte de los usuarios</li>
                  <li>La disponibilidad continua del Sitio Web (puede haber interrupciones por mantenimiento)</li>
                  <li>Los contenidos de sitios web de terceros enlazados desde el Sitio Web</li>
                  <li>Los virus o elementos dañinos introducidos por terceros</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Enlaces a terceros</h2>
                <p className="leading-relaxed">
                  El Sitio Web puede contener enlaces a sitios web de terceros. MilAutónomos no controla ni es responsable del contenido, 
                  políticas de privacidad o prácticas de estos sitios externos. El acceso y uso de sitios enlazados es bajo la exclusiva responsabilidad del usuario.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Protección de datos</h2>
                <p className="leading-relaxed">
                  MilAutónomos cumple con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos (LOPD). 
                  Para más información sobre cómo tratamos tus datos personales, consulta nuestra{" "}
                  <Link to={createPageUrl("PrivacyPolicy")} className="text-blue-600 hover:underline">
                    Política de Privacidad
                  </Link>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies</h2>
                <p className="leading-relaxed">
                  El Sitio Web utiliza cookies para mejorar la experiencia del usuario. Para más información, consulta nuestra{" "}
                  <Link to={createPageUrl("CookiePolicy")} className="text-blue-600 hover:underline">
                    Política de Cookies
                  </Link>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modificaciones</h2>
                <p className="leading-relaxed">
                  MilAutónomos se reserva el derecho de modificar el presente Aviso Legal en cualquier momento. 
                  Se recomienda revisar periódicamente esta página para estar informado de posibles cambios.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Legislación aplicable y jurisdicción</h2>
                <p className="leading-relaxed">
                  El presente Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del uso del Sitio Web, 
                  las partes se someten expresamente a los Juzgados y Tribunales de Madrid, España.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contacto</h2>
                <p className="leading-relaxed mb-4">
                  Para cualquier consulta relacionada con este Aviso Legal, puedes contactarnos en:
                </p>
                <ul className="list-none pl-0 space-y-2">
                  <li>📧 Email: <a href="mailto:legal@milautonomos.com" className="text-blue-600 hover:underline">legal@milautonomos.com</a></li>
                  <li>📞 Teléfono: +34 900 123 456</li>
                  <li>📍 Dirección postal: Madrid, España</li>
                </ul>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}