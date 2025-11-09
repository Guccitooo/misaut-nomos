
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  HelpCircle, 
  Phone, 
  Mail, 
  MessageSquare, 
  Book,
  ArrowLeft,
  Search,
  User,
  CreditCard,
  Settings,
  FileText
} from "lucide-react";

export default function HelpCenterPage() {
  const sections = [
    {
      icon: User,
      title: "Para Clientes",
      questions: [
        "¿Cómo busco un profesional?",
        "¿Es gratis para clientes?",
        "¿Cómo contacto con un autónomo?",
        "¿Cómo dejo una valoración?"
      ]
    },
    {
      icon: CreditCard,
      title: "Para Profesionales",
      questions: [
        "¿Cómo me doy de alta?",
        "¿Qué planes hay disponibles?",
        "¿Cómo completo mi perfil?",
        "¿Cómo renuevo mi suscripción?"
      ]
    },
    {
      icon: Settings,
      title: "Gestión de Cuenta",
      questions: [
        "¿Cómo cambio mi contraseña?",
        "¿Cómo actualizo mi información?",
        "¿Cómo elimino mi cuenta?",
        "¿Cómo gestiono mis notificaciones?"
      ]
    },
    {
      icon: FileText,
      title: "Facturación y Pagos",
      questions: [
        "¿Qué métodos de pago aceptan?",
        "¿Cómo cancelo mi suscripción?",
        "¿Puedo obtener factura?",
        "¿Hay reembolsos?"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link to={createPageUrl("Search")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Centro de Ayuda
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ¿Necesitas ayuda? Encuentra respuestas a las preguntas más frecuentes
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Teléfono</h3>
              <p className="text-gray-600 mb-4">Lun - Vie: 9:00 - 18:00</p>
              <a href="tel:+34900123456" className="text-blue-600 hover:text-blue-700 font-medium">
                +34 900 123 456
              </a>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Mail className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Email</h3>
              <p className="text-gray-600 mb-4">Respuesta en 24h</p>
              <a href="mailto:soporte@autonomosmil.es" className="text-green-600 hover:text-green-700 font-medium">
                soporte@autonomosmil.es
              </a>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Chat en vivo</h3>
              <p className="text-gray-600 mb-4">Respuesta inmediata</p>
              <Button className="bg-orange-500 hover:bg-orange-600">
                Iniciar chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Sections */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {sections.map((section, idx) => (
            <Card key={idx} className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <section.icon className="w-6 h-6 text-blue-600" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.questions.map((question, qIdx) => (
                    <li key={qIdx}>
                      <Link to={createPageUrl("FAQ")} className="text-gray-700 hover:text-blue-600 transition-colors flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{question}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-8 text-center">
            <Book className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-bold mb-4">¿No encuentras lo que buscas?</h2>
            <p className="mb-6 opacity-90">
              Consulta nuestra sección de preguntas frecuentes o contáctanos directamente
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl("FAQ")}>
                <Button variant="secondary" size="lg">
                  Ver todas las FAQ
                </Button>
              </Link>
              <a href="mailto:soporte@autonomosmil.es">
                <Button variant="outline" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Contactar soporte
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
