import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale } from "lucide-react";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";

export default function LegalNoticePage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const content = {
    es: {
      title: "Aviso Legal",
      subtitle: "Última actualización: 15 de enero de 2025",
      sections: [
        {
          title: "1. Datos Identificativos",
          text: "En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico, se informa que: Titular: MisAutónomos, Domicilio: Madrid, España, Email: info@misautonomos.es, Web: https://misautonomos.es"
        },
        {
          title: "2. Objeto",
          text: "El presente aviso legal regula el uso del sitio web MisAutónomos (en adelante, el sitio web). La navegación por el sitio web atribuye la condición de usuario y conlleva la aceptación plena de todas las disposiciones incluidas en este aviso legal."
        },
        {
          title: "3. Condiciones de Uso",
          text: "El usuario se compromete a utilizar el sitio web y sus servicios conforme a la ley, el presente aviso legal, y las buenas costumbres. Queda prohibido el uso del sitio web con fines ilícitos o que perjudiquen los intereses de MisAutónomos o de terceros."
        },
        {
          title: "4. Propiedad Intelectual e Industrial",
          text: "Todos los contenidos del sitio web (textos, imágenes, marcas, logotipos, código fuente, diseño gráfico) son propiedad de MisAutónomos o de terceros que han autorizado su uso. Quedan reservados todos los derechos sobre los mismos."
        },
        {
          title: "5. Responsabilidad",
          text: "MisAutónomos no se hace responsable de: (a) La disponibilidad técnica y continuidad del sitio web, (b) Información o contenidos publicados por usuarios, (c) Servicios prestados por profesionales a clientes, (d) Daños derivados del uso indebido del sitio web."
        },
        {
          title: "6. Enlaces",
          text: "El sitio web puede contener enlaces a sitios web de terceros. MisAutónomos no controla ni se hace responsable del contenido, políticas de privacidad o prácticas de dichos sitios web externos."
        },
        {
          title: "7. Protección de Datos",
          text: "Para información sobre cómo tratamos sus datos personales, consulte nuestra Política de Privacidad."
        },
        {
          title: "8. Legislación Aplicable",
          text: "El presente aviso legal se rige por la legislación española. Para cualquier controversia será competente la jurisdicción de Madrid, España."
        },
        {
          title: "9. Contacto",
          text: "Para comunicaciones legales: info@misautonomos.es"
        }
      ]
    },
    en: {
      title: "Legal Notice",
      subtitle: "Last updated: January 15, 2025",
      sections: [
        {
          title: "1. Identifying Information",
          text: "In compliance with article 10 of Law 34/2002 on Information Society Services and Electronic Commerce, we inform: Owner: MisAutónomos, Address: Madrid, Spain, Email: info@misautonomos.es, Website: https://misautonomos.es"
        },
        {
          title: "2. Purpose",
          text: "This legal notice regulates the use of the MisAutónomos website (hereinafter, the website). Browsing the website grants user status and implies full acceptance of all provisions included in this legal notice."
        },
        {
          title: "3. Terms of Use",
          text: "The user agrees to use the website and its services in accordance with the law, this legal notice, and good practices. Use of the website for unlawful purposes or that harm MisAutónomos or third parties is prohibited."
        },
        {
          title: "4. Intellectual and Industrial Property",
          text: "All website content (texts, images, trademarks, logos, source code, graphic design) is property of MisAutónomos or third parties who have authorized its use. All rights thereto are reserved."
        },
        {
          title: "5. Liability",
          text: "MisAutónomos is not responsible for: (a) Technical availability and continuity of the website, (b) Information or content published by users, (c) Services provided by professionals to clients, (d) Damages arising from improper use of the website."
        },
        {
          title: "6. Links",
          text: "The website may contain links to third-party websites. MisAutónomos does not control and is not responsible for the content, privacy policies or practices of such external websites."
        },
        {
          title: "7. Data Protection",
          text: "For information on how we process your personal data, see our Privacy Policy."
        },
        {
          title: "8. Applicable Law",
          text: "This legal notice is governed by Spanish law. For any dispute, the jurisdiction of Madrid, Spain shall be competent."
        },
        {
          title: "9. Contact",
          text: "For legal communications: info@misautonomos.es"
        }
      ]
    }
  };

  const currentContent = content[language] || content.es;

  return (
    <>
      <SEOHead 
        title={`${currentContent.title} - MisAutónomos`}
        description="Aviso legal de la plataforma MisAutónomos"
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
                <Scale className="w-8 h-8" />
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
                    ? 'Para comunicaciones legales' 
                    : 'For legal communications'}: 
                  <a href="mailto:info@misautonomos.es" className="text-blue-600 hover:text-blue-800 ml-1 font-semibold">
                    info@misautonomos.es
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