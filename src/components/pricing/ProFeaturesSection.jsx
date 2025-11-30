import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  MessageSquare,
  FileText,
  CreditCard,
  Users,
  LayoutDashboard,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "../ui/LanguageSwitcher";

const features = [
  {
    icon: Eye,
    title: "Visibilidad pública",
    titleEn: "Public visibility",
    description: "Aparece en búsquedas",
    descriptionEn: "Appear in searches",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  {
    icon: MessageSquare,
    title: "Mensajes y contactos",
    titleEn: "Messages & contacts",
    description: "Chat directo con clientes",
    descriptionEn: "Direct chat with clients",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    iconColor: "text-green-600"
  },
  {
    icon: FileText,
    title: "Facturas profesionales",
    titleEn: "Professional invoices",
    description: "Con logo, IVA y PDF",
    descriptionEn: "With logo, VAT and PDF",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600"
  },
  {
    icon: CreditCard,
    title: "Enlaces de pago",
    titleEn: "Payment links",
    description: "Cobra por tarjeta",
    descriptionEn: "Collect by card",
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600"
  },
  {
    icon: Users,
    title: "Gestión de clientes",
    titleEn: "Client management",
    description: "Base de datos y notas",
    descriptionEn: "Database and notes",
    color: "from-teal-500 to-teal-600",
    bgColor: "bg-teal-50",
    iconColor: "text-teal-600"
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Pro",
    titleEn: "Pro Dashboard",
    description: "Control total",
    descriptionEn: "Total control",
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600"
  }
];

export default function ProFeaturesSection({ variant = "full" }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  if (variant === "compact") {
    return (
      <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {isEn ? "What do you get with your subscription?" : "¿Qué obtienes con tu suscripción?"}
          </h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {features.slice(0, 6).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-8 h-8 ${feature.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className={`w-4 h-4 ${feature.iconColor}`} />
                </div>
                <span className="text-sm text-gray-700 font-medium">{isEn ? feature.titleEn : feature.title}</span>
              </div>
            ))}
          </div>

          <Link to={createPageUrl("DashboardProInfo")}>
            <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700 font-semibold">
              {isEn ? "Learn more" : "Saber más"} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="py-12 bg-white rounded-3xl shadow-lg border border-gray-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {isEn ? "What Does Your Pro Subscription Include?" : "¿Qué Incluye tu Suscripción Pro?"}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isEn 
              ? "All the tools you need to grow your business"
              : "Todas las herramientas que necesitas para hacer crecer tu negocio"
            }
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className={`${feature.bgColor} rounded-xl p-4 md:p-5 text-center hover:shadow-md transition-shadow`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                {isEn ? feature.titleEn : feature.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-600">
                {isEn ? feature.descriptionEn : feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to={createPageUrl("DashboardProInfo")}>
            <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base font-semibold rounded-xl shadow-lg">
              {isEn ? "See All Dashboard Pro Details" : "Ver Todos los Detalles del Dashboard Pro"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}