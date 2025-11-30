import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  MessageSquare,
  FileText,
  CreditCard,
  Users,
  LayoutDashboard,
  Rocket,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Award
} from "lucide-react";
import SEOHead from "../components/seo/SEOHead";
import { useLanguage } from "../components/ui/LanguageSwitcher";

const features = [
  {
    icon: Eye,
    title: "Visibilidad Pública",
    titleEn: "Public Visibility",
    description: "Tu perfil aparece en las búsquedas de clientes. Miles de personas podrán encontrarte cada día según tu zona y servicios.",
    descriptionEn: "Your profile appears in client searches. Thousands of people can find you every day based on your area and services.",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    benefits: [
      "Apareces en resultados de búsqueda",
      "Ficha pública con fotos y descripción",
      "Valoraciones de clientes visibles",
      "Posicionamiento por ubicación"
    ],
    benefitsEn: [
      "Appear in search results",
      "Public profile with photos and description",
      "Visible client reviews",
      "Location-based positioning"
    ]
  },
  {
    icon: MessageSquare,
    title: "Mensajes y Contactos",
    titleEn: "Messages & Contacts",
    description: "Los clientes te contactan directamente desde tu ficha. Recibe mensajes, fotos del trabajo y todos los detalles que necesitas.",
    descriptionEn: "Clients contact you directly from your profile. Receive messages, work photos and all the details you need.",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    benefits: [
      "Chat directo con clientes",
      "Envío de fotos y archivos",
      "Historial de conversaciones",
      "Notificaciones en tiempo real"
    ],
    benefitsEn: [
      "Direct chat with clients",
      "Send photos and files",
      "Conversation history",
      "Real-time notifications"
    ]
  },
  {
    icon: FileText,
    title: "Facturas Profesionales",
    titleEn: "Professional Invoices",
    description: "Crea facturas con tu logo, múltiples conceptos, IVA desglosado y descarga en PDF. Todo legal y profesional.",
    descriptionEn: "Create invoices with your logo, multiple items, itemized VAT and download as PDF. Everything legal and professional.",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    benefits: [
      "Logo personalizado",
      "Múltiples líneas y conceptos",
      "IVA y retenciones automáticas",
      "Descarga PDF profesional"
    ],
    benefitsEn: [
      "Custom logo",
      "Multiple lines and items",
      "Automatic VAT and withholdings",
      "Professional PDF download"
    ]
  },
  {
    icon: CreditCard,
    title: "Enlaces de Pago",
    titleEn: "Payment Links",
    description: "Envía un enlace de pago por tarjeta a tu cliente. Cobra al instante y la factura se marca como pagada automáticamente.",
    descriptionEn: "Send a card payment link to your client. Get paid instantly and the invoice is marked as paid automatically.",
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
    benefits: [
      "Pago con tarjeta seguro",
      "Cobro instantáneo",
      "Factura actualizada automáticamente",
      "Sin comisiones ocultas"
    ],
    benefitsEn: [
      "Secure card payment",
      "Instant collection",
      "Automatically updated invoice",
      "No hidden fees"
    ]
  },
  {
    icon: Users,
    title: "Gestión de Clientes",
    titleEn: "Client Management",
    description: "Mantén una lista organizada de todos tus clientes con notas internas, historial de trabajos y pagos.",
    descriptionEn: "Keep an organized list of all your clients with internal notes, work history and payments.",
    color: "from-teal-500 to-teal-600",
    bgColor: "bg-teal-50",
    iconColor: "text-teal-600",
    benefits: [
      "Base de datos de clientes",
      "Notas internas privadas",
      "Historial de trabajos",
      "Seguimiento de pagos"
    ],
    benefitsEn: [
      "Client database",
      "Private internal notes",
      "Work history",
      "Payment tracking"
    ]
  },
  {
    icon: LayoutDashboard,
    title: "Panel Pro Completo",
    titleEn: "Complete Pro Dashboard",
    description: "Dashboard actualizado en tiempo real con ingresos, mensajes pendientes, estado del perfil y métricas clave.",
    descriptionEn: "Real-time updated dashboard with earnings, pending messages, profile status and key metrics.",
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600",
    benefits: [
      "Vista de ingresos mensual",
      "Contador de mensajes nuevos",
      "Estado de visibilidad",
      "Métricas de rendimiento"
    ],
    benefitsEn: [
      "Monthly earnings view",
      "New messages counter",
      "Visibility status",
      "Performance metrics"
    ]
  }
];

const stats = [
  { value: "5.000+", label: "Búsquedas diarias", labelEn: "Daily searches", icon: TrendingUp },
  { value: "24/7", label: "Disponibilidad", labelEn: "Availability", icon: Clock },
  { value: "100%", label: "Seguro y legal", labelEn: "Safe and legal", icon: Shield },
  { value: "0€", label: "Sin comisiones extra", labelEn: "No extra fees", icon: Zap }
];

export default function DashboardProInfoPage() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <>
      <SEOHead
        title={isEn ? "How the Pro Dashboard Works - MisAutónomos" : "Cómo Funciona el Dashboard Pro - MisAutónomos"}
        description={isEn 
          ? "Discover everything included in your MisAutónomos Pro subscription: visibility, invoices, payments, client management and more."
          : "Descubre todo lo que incluye tu suscripción Pro en MisAutónomos: visibilidad, facturas, cobros, gestión de clientes y mucho más."
        }
        keywords="dashboard pro, suscripción autónomos, gestión clientes, facturas, cobros online"
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 md:py-24">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
          
          <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
            <Badge className="bg-white/20 text-white border-white/30 mb-6 px-4 py-2 text-sm font-medium">
              <Award className="w-4 h-4 mr-2 inline" />
              {isEn ? "Complete Professional Solution" : "Solución Profesional Completa"}
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {isEn ? "Everything Your Business Needs" : "Todo lo que tu Negocio Necesita"}
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              {isEn 
                ? "With MisAutónomos Pro you get visibility, contacts, invoices and payments in one place. Focus on working, we take care of the rest."
                : "Con MisAutónomos Pro tienes visibilidad, contactos, facturas y cobros en un solo lugar. Céntrate en trabajar, nosotros nos encargamos del resto."
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl("PricingPlans")}>
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 h-14 px-8 text-lg font-semibold shadow-xl rounded-xl w-full sm:w-auto">
                  <Rocket className="w-5 h-5 mr-2" />
                  {isEn ? "Start Now - 2 Months Free" : "Empezar Ahora - 2 Meses Gratis"}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{isEn ? stat.labelEn : stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="bg-blue-100 text-blue-700 mb-4">
                {isEn ? "Complete Features" : "Funcionalidades Completas"}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {isEn ? "What Does Your Pro Subscription Include?" : "¿Qué Incluye tu Suscripción Pro?"}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {isEn 
                  ? "All the tools you need to manage your business professionally"
                  : "Todas las herramientas que necesitas para gestionar tu negocio de forma profesional"
                }
              </p>
            </div>

            <div className="grid gap-8 md:gap-10">
              {features.map((feature, idx) => (
                <Card key={idx} className="border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Icon and Title */}
                      <div className={`${feature.bgColor} p-6 lg:p-8 lg:w-1/3`}>
                        <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                          <feature.icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {isEn ? feature.titleEn : feature.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {isEn ? feature.descriptionEn : feature.description}
                        </p>
                      </div>

                      {/* Benefits */}
                      <div className="p-6 lg:p-8 lg:w-2/3 bg-white flex items-center">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                          {(isEn ? feature.benefitsEn : feature.benefits).map((benefit, bidx) => (
                            <div key={bidx} className="flex items-start gap-3">
                              <div className={`w-6 h-6 rounded-full ${feature.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                <CheckCircle className={`w-4 h-4 ${feature.iconColor}`} />
                              </div>
                              <span className="text-gray-700">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Global Benefit Section */}
        <section className="py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {isEn ? "The Complete Solution for Your Business" : "La Solución Completa para tu Negocio"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{isEn ? "More Clients" : "Más Clientes"}</h3>
                <p className="text-gray-400">{isEn ? "Thousands of people search for professionals every day" : "Miles de personas buscan profesionales cada día"}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{isEn ? "More Control" : "Más Control"}</h3>
                <p className="text-gray-400">{isEn ? "Everything in one place, no wasted time" : "Todo en un solo lugar, sin perder tiempo"}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{isEn ? "Professional Image" : "Imagen Profesional"}</h3>
                <p className="text-gray-400">{isEn ? "Invoices, profile and communications at your level" : "Facturas, perfil y comunicaciones a tu nivel"}</p>
              </div>
            </div>

            <Link to={createPageUrl("PricingPlans")}>
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-14 px-10 text-lg font-semibold shadow-xl rounded-xl">
                {isEn ? "See Plans and Start" : "Ver Planes y Empezar"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {isEn ? "Start Today with 2 Free Months" : "Empieza Hoy con 2 Meses Gratis"}
                </h2>
                
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  {isEn 
                    ? "No commitment, cancel anytime. If you don't like it, you don't pay."
                    : "Sin permanencia, cancela cuando quieras. Si no te gusta, no pagas."
                  }
                </p>

                <Link to={createPageUrl("PricingPlans")}>
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 h-14 px-10 text-lg font-semibold shadow-xl rounded-xl">
                    <Rocket className="w-5 h-5 mr-2" />
                    {isEn ? "See Plans" : "Ver Planes"}
                  </Button>
                </Link>

                <p className="text-sm text-blue-200 mt-6">
                  {isEn ? "100% secure payment • Cancel anytime" : "Pago 100% seguro • Cancela cuando quieras"}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}