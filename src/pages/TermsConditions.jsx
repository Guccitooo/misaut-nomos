import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";

export default function TermsConditionsPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const content = {
    es: {
      title: "Términos y Condiciones",
      subtitle: "Última actualización: 15 de enero de 2025",
      sections: [
        {
          title: "1. Aceptación de los Términos",
          text: "Al acceder y utilizar MisAutónomos, usted acepta estar legalmente vinculado por estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios."
        },
        {
          title: "2. Descripción del Servicio",
          text: "MisAutónomos es una plataforma digital que conecta clientes con profesionales autónomos verificados en España. Facilitamos el contacto entre ambas partes pero no somos responsables de la calidad, seguridad o legalidad de los servicios prestados por los profesionales."
        },
        {
          title: "3. Registro y Cuentas de Usuario",
          text: "Para utilizar ciertos servicios, debe crear una cuenta proporcionando información precisa y actualizada. Usted es responsable de mantener la confidencialidad de su cuenta y contraseña, y de todas las actividades que ocurran bajo su cuenta."
        },
        {
          title: "4. Obligaciones de los Profesionales",
          text: "Los profesionales que se registren en MisAutónomos deben: (a) Estar legalmente autorizados para trabajar como autónomos en España, (b) Proporcionar información veraz y verificable, (c) Mantener actualizado su perfil y disponibilidad, (d) Cumplir con todas las leyes y regulaciones aplicables."
        },
        {
          title: "5. Obligaciones de los Clientes",
          text: "Los clientes que utilicen MisAutónomos deben: (a) Proporcionar información precisa sobre los servicios requeridos, (b) Comunicarse de manera respetuosa con los profesionales, (c) Cumplir con los acuerdos establecidos con los profesionales."
        },
        {
          title: "6. Suscripciones y Pagos",
          text: "Los profesionales deben mantener una suscripción activa para aparecer en las búsquedas. Las suscripciones se renuevan automáticamente a menos que se cancelen antes de la fecha de renovación. Los pagos se procesan a través de Stripe. Todos los precios incluyen IVA cuando aplique."
        },
        {
          title: "7. Contenido del Usuario",
          text: "Usted conserva todos los derechos sobre el contenido que publique en MisAutónomos. Sin embargo, nos otorga una licencia mundial, no exclusiva y libre de regalías para usar, reproducir y mostrar dicho contenido en relación con el funcionamiento de nuestros servicios."
        },
        {
          title: "8. Propiedad Intelectual",
          text: "Todo el contenido de MisAutónomos, incluyendo pero no limitado a textos, gráficos, logos, iconos, imágenes y software, es propiedad de MisAutónomos o sus licenciantes y está protegido por las leyes de propiedad intelectual españolas e internacionales."
        },
        {
          title: "9. Limitación de Responsabilidad",
          text: "MisAutónomos actúa únicamente como intermediario. No somos responsables de: (a) La calidad, seguridad o legalidad de los servicios ofrecidos, (b) La veracidad de los perfiles profesionales, (c) Daños directos o indirectos derivados del uso de la plataforma, (d) Disputas entre clientes y profesionales."
        },
        {
          title: "10. Suspensión y Terminación",
          text: "Nos reservamos el derecho de suspender o terminar su cuenta si: (a) Viola estos términos, (b) Proporciona información falsa, (c) Usa la plataforma para actividades ilegales, (d) Abusa o acosa a otros usuarios."
        },
        {
          title: "11. Modificaciones",
          text: "Podemos modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la plataforma. El uso continuado del servicio constituye su aceptación de los términos modificados."
        },
        {
          title: "12. Ley Aplicable y Jurisdicción",
          text: "Estos términos se regirán e interpretarán de acuerdo con las leyes de España. Cualquier disputa se someterá a la jurisdicción exclusiva de los tribunales de Madrid, España."
        },
        {
          title: "13. Contacto",
          text: "Para cualquier consulta sobre estos términos, puede contactarnos en: soporte@misautonomos.es"
        }
      ]
    },
    en: {
      title: "Terms and Conditions",
      subtitle: "Last updated: January 15, 2025",
      sections: [
        {
          title: "1. Acceptance of Terms",
          text: "By accessing and using MisAutónomos, you agree to be legally bound by these terms and conditions. If you do not agree with any part of these terms, you should not use our services."
        },
        {
          title: "2. Service Description",
          text: "MisAutónomos is a digital platform that connects clients with verified freelance professionals in Spain. We facilitate contact between both parties but are not responsible for the quality, safety or legality of services provided by professionals."
        },
        {
          title: "3. User Registration and Accounts",
          text: "To use certain services, you must create an account providing accurate and up-to-date information. You are responsible for maintaining the confidentiality of your account and password, and for all activities that occur under your account."
        },
        {
          title: "4. Professional Obligations",
          text: "Professionals who register on MisAutónomos must: (a) Be legally authorized to work as freelancers in Spain, (b) Provide truthful and verifiable information, (c) Keep their profile and availability updated, (d) Comply with all applicable laws and regulations."
        },
        {
          title: "5. Client Obligations",
          text: "Clients using MisAutónomos must: (a) Provide accurate information about required services, (b) Communicate respectfully with professionals, (c) Comply with agreements established with professionals."
        },
        {
          title: "6. Subscriptions and Payments",
          text: "Professionals must maintain an active subscription to appear in searches. Subscriptions renew automatically unless canceled before the renewal date. Payments are processed through Stripe. All prices include VAT when applicable."
        },
        {
          title: "7. User Content",
          text: "You retain all rights to content you publish on MisAutónomos. However, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce and display such content in connection with the operation of our services."
        },
        {
          title: "8. Intellectual Property",
          text: "All content on MisAutónomos, including but not limited to text, graphics, logos, icons, images and software, is property of MisAutónomos or its licensors and is protected by Spanish and international intellectual property laws."
        },
        {
          title: "9. Limitation of Liability",
          text: "MisAutónomos acts only as an intermediary. We are not responsible for: (a) Quality, safety or legality of services offered, (b) Truthfulness of professional profiles, (c) Direct or indirect damages arising from platform use, (d) Disputes between clients and professionals."
        },
        {
          title: "10. Suspension and Termination",
          text: "We reserve the right to suspend or terminate your account if: (a) You violate these terms, (b) You provide false information, (c) You use the platform for illegal activities, (d) You abuse or harass other users."
        },
        {
          title: "11. Modifications",
          text: "We may modify these terms at any time. Changes will take effect immediately after publication on the platform. Continued use of the service constitutes acceptance of the modified terms."
        },
        {
          title: "12. Applicable Law and Jurisdiction",
          text: "These terms shall be governed and interpreted in accordance with the laws of Spain. Any dispute shall be subject to the exclusive jurisdiction of the courts of Madrid, Spain."
        },
        {
          title: "13. Contact",
          text: "For any questions about these terms, you can contact us at: soporte@misautonomos.es"
        }
      ]
    }
  };

  const currentContent = content[language] || content.es;

  return (
    <>
      <SEOHead 
        title={`${currentContent.title} - MisAutónomos`}
        description="Lee nuestros términos y condiciones de uso de la plataforma MisAutónomos"
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
                <FileText className="w-8 h-8" />
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
                    ? 'Para cualquier consulta, contáctanos en' 
                    : 'For any questions, contact us at'}: 
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