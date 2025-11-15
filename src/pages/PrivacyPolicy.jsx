import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const content = {
    es: {
      title: "Política de Privacidad",
      subtitle: "Última actualización: 15 de enero de 2025",
      sections: [
        {
          title: "1. Responsable del Tratamiento",
          text: "MisAutónomos es responsable del tratamiento de sus datos personales. Nuestro compromiso es proteger su privacidad y garantizar la seguridad de su información."
        },
        {
          title: "2. Datos que Recopilamos",
          text: "Recopilamos la siguiente información: (a) Datos de identificación: nombre, email, teléfono, (b) Datos profesionales: CIF/NIF, categorías de servicio, ubicación, (c) Datos de uso: interacciones con la plataforma, mensajes, favoritos, (d) Datos de pago: información de facturación gestionada por Stripe."
        },
        {
          title: "3. Finalidad del Tratamiento",
          text: "Utilizamos sus datos para: (a) Proporcionar y mejorar nuestros servicios, (b) Facilitar la conexión entre clientes y profesionales, (c) Procesar pagos y suscripciones, (d) Enviar comunicaciones relacionadas con el servicio, (e) Cumplir con obligaciones legales."
        },
        {
          title: "4. Base Legal",
          text: "Tratamos sus datos con base en: (a) Ejecución del contrato de servicio, (b) Consentimiento del usuario, (c) Interés legítimo de MisAutónomos, (d) Cumplimiento de obligaciones legales."
        },
        {
          title: "5. Compartición de Datos",
          text: "Sus datos pueden compartirse con: (a) Profesionales/clientes con quienes interactúe, (b) Stripe para procesamiento de pagos, (c) Proveedores de servicios técnicos (hosting, email), (d) Autoridades cuando sea legalmente requerido."
        },
        {
          title: "6. Conservación de Datos",
          text: "Conservamos sus datos mientras: (a) Mantenga su cuenta activa, (b) Sea necesario para cumplir obligaciones legales, (c) Existan reclamaciones pendientes. Tras eliminar su cuenta, sus datos se borrarán en un plazo de 30 días."
        },
        {
          title: "7. Sus Derechos",
          text: "Tiene derecho a: (a) Acceder a sus datos personales, (b) Rectificar datos incorrectos, (c) Solicitar la eliminación de sus datos, (d) Oponerse al tratamiento, (e) Portabilidad de datos, (f) Revocar el consentimiento. Para ejercer sus derechos, contacte: soporte@misautonomos.es"
        },
        {
          title: "8. Seguridad",
          text: "Implementamos medidas técnicas y organizativas para proteger sus datos contra acceso no autorizado, alteración, divulgación o destrucción. Utilizamos cifrado SSL, autenticación segura y almacenamiento protegido."
        },
        {
          title: "9. Cookies",
          text: "Utilizamos cookies para mejorar su experiencia. Puede gestionar las preferencias de cookies en nuestra Política de Cookies."
        },
        {
          title: "10. Cambios en la Política",
          text: "Podemos actualizar esta política ocasionalmente. Le notificaremos sobre cambios significativos por email o mediante aviso en la plataforma."
        },
        {
          title: "11. Contacto",
          text: "Para consultas sobre privacidad: soporte@misautonomos.es"
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      subtitle: "Last updated: January 15, 2025",
      sections: [
        {
          title: "1. Data Controller",
          text: "MisAutónomos is responsible for processing your personal data. Our commitment is to protect your privacy and ensure the security of your information."
        },
        {
          title: "2. Data We Collect",
          text: "We collect the following information: (a) Identification data: name, email, phone, (b) Professional data: CIF/NIF, service categories, location, (c) Usage data: platform interactions, messages, favorites, (d) Payment data: billing information managed by Stripe."
        },
        {
          title: "3. Purpose of Processing",
          text: "We use your data to: (a) Provide and improve our services, (b) Facilitate connection between clients and professionals, (c) Process payments and subscriptions, (d) Send service-related communications, (e) Comply with legal obligations."
        },
        {
          title: "4. Legal Basis",
          text: "We process your data based on: (a) Performance of service contract, (b) User consent, (c) Legitimate interest of MisAutónomos, (d) Compliance with legal obligations."
        },
        {
          title: "5. Data Sharing",
          text: "Your data may be shared with: (a) Professionals/clients you interact with, (b) Stripe for payment processing, (c) Technical service providers (hosting, email), (d) Authorities when legally required."
        },
        {
          title: "6. Data Retention",
          text: "We retain your data while: (a) You maintain your active account, (b) It's necessary to comply with legal obligations, (c) Pending claims exist. After deleting your account, your data will be erased within 30 days."
        },
        {
          title: "7. Your Rights",
          text: "You have the right to: (a) Access your personal data, (b) Rectify incorrect data, (c) Request deletion of your data, (d) Object to processing, (e) Data portability, (f) Revoke consent. To exercise your rights, contact: soporte@misautonomos.es"
        },
        {
          title: "8. Security",
          text: "We implement technical and organizational measures to protect your data against unauthorized access, alteration, disclosure or destruction. We use SSL encryption, secure authentication and protected storage."
        },
        {
          title: "9. Cookies",
          text: "We use cookies to improve your experience. You can manage cookie preferences in our Cookie Policy."
        },
        {
          title: "10. Policy Changes",
          text: "We may update this policy occasionally. We will notify you about significant changes by email or notice on the platform."
        },
        {
          title: "11. Contact",
          text: "For privacy inquiries: soporte@misautonomos.es"
        }
      ]
    }
  };

  const currentContent = content[language] || content.es;

  return (
    <>
      <SEOHead 
        title={`${currentContent.title} - MisAutónomos`}
        description="Conoce cómo protegemos tus datos personales en MisAutónomos"
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
                <Shield className="w-8 h-8" />
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
                    ? 'Para ejercer sus derechos o consultas sobre privacidad' 
                    : 'To exercise your rights or privacy inquiries'}: 
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