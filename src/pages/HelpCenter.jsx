import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  BookOpen,
  Users,
  Briefcase,
  Shield,
  CreditCard,
  User,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";
import { FAQPageSchema } from "../components/seo/StructuredData";

const categoryConfig = {
  platform: {
    icon: BookOpen,
    color: "bg-blue-500",
    label_es: "Sobre la plataforma",
    label_en: "About the platform"
  },
  clients: {
    icon: Users,
    color: "bg-green-500",
    label_es: "Para clientes",
    label_en: "For clients"
  },
  professionals: {
    icon: Briefcase,
    color: "bg-blue-600",
    label_es: "Para autónomos",
    label_en: "For professionals"
  },
  security: {
    icon: Shield,
    color: "bg-amber-500",
    label_es: "Seguridad",
    label_en: "Security"
  },
  payments: {
    icon: CreditCard,
    color: "bg-green-600",
    label_es: "Pagos y suscripciones",
    label_en: "Payments & subscriptions"
  },
  profile: {
    icon: User,
    color: "bg-blue-500",
    label_es: "Perfil profesional",
    label_en: "Professional profile"
  },
  troubleshooting: {
    icon: AlertCircle,
    color: "bg-red-500",
    label_es: "Resolución de problemas",
    label_en: "Troubleshooting"
  }
};

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const allFaqs = await base44.entities.FAQ.filter({ published: true });
      return allFaqs.sort((a, b) => (b.views || 0) - (a.views || 0));
    },
  });

  const { data: popularArticles = [] } = useQuery({
    queryKey: ['popularFaqs'],
    queryFn: async () => {
      const allFaqs = await base44.entities.FAQ.filter({ published: true });
      return allFaqs.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
    },
  });

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const searchLower = value.toLowerCase();
    const results = faqs.filter(faq => {
      const title = language === 'es' ? faq.title_es : faq.title_en;
      const content = language === 'es' ? faq.content_es : faq.content_en;
      const summary = language === 'es' ? faq.summary_es : faq.summary_en;
      
      return title.toLowerCase().includes(searchLower) ||
             content.toLowerCase().includes(searchLower) ||
             summary.toLowerCase().includes(searchLower) ||
             faq.tags.some(tag => tag.toLowerCase().includes(searchLower));
    }).slice(0, 5);

    setSearchResults(results);
  };

  const getCategoryLabel = (category) => {
    return language === 'es' 
      ? categoryConfig[category]?.label_es 
      : categoryConfig[category]?.label_en;
  };

  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return (
    <>
      <SEOHead 
        title={language === 'es' ? "Centro de Ayuda - MisAutónomos" : "Help Center - MisAutónomos"}
        description={language === 'es' 
          ? "Encuentra respuestas a tus preguntas sobre MisAutónomos. Guías para clientes y profesionales."
          : "Find answers to your questions about MisAutónomos. Guides for clients and professionals."}
        keywords="ayuda, soporte, FAQ, guías, tutoriales, help center"
      />
      
      <FAQPageSchema faqs={popularArticles} language={language} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {language === 'es' ? '¿En qué podemos ayudarte?' : 'How can we help you?'}
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              {language === 'es' 
                ? 'Busca en nuestra base de conocimientos o explora por categorías'
                : 'Search our knowledge base or browse by categories'}
            </p>

            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={language === 'es' ? "Buscar en el centro de ayuda..." : "Search help center..."}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-14 text-lg bg-white text-gray-900 border-0 shadow-lg"
              />
              
              {searchResults.length > 0 && (
                <Card className="absolute w-full mt-2 z-50 shadow-xl animate-slide-down">
                  <CardContent className="p-2">
                    {searchResults.map((faq) => (
                      <button
                        key={faq.id}
                        onClick={() => {
                          navigate(createPageUrl("FAQDetail") + `?id=${faq.id}`);
                          setSearchTerm("");
                          setSearchResults([]);
                        }}
                        className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <p className="font-semibold text-gray-900">
                          {language === 'es' ? faq.title_es : faq.title_en}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {language === 'es' ? faq.summary_es : faq.summary_en}
                        </p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
              <Link to={createPageUrl("FAQ")}>
                <Button variant="secondary" size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  {language === 'es' ? 'Ver todas las FAQs' : 'View all FAQs'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              {language === 'es' ? 'Artículos populares' : 'Popular articles'}
            </h2>
            <p className="text-gray-600 mb-6">
              {language === 'es' 
                ? 'Los artículos más consultados por nuestra comunidad'
                : 'Most viewed articles by our community'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularArticles.map((faq) => (
                <Card key={faq.id} className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-100 hover:border-blue-200">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      {React.createElement(categoryConfig[faq.category]?.icon || BookOpen, {
                        className: "w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                      })}
                      <h3 
                        className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-700 transition-colors"
                        onClick={() => navigate(createPageUrl("FAQDetail") + `?id=${faq.id}`)}
                      >
                        {language === 'es' ? faq.title_es : faq.title_en}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {language === 'es' ? faq.summary_es : faq.summary_en}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(faq.category)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(createPageUrl("FAQDetail") + `?id=${faq.id}`)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        {language === 'es' ? 'Leer más' : 'Read more'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {language === 'es' ? 'Explorar por categoría' : 'Browse by category'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const count = faqsByCategory[key]?.length || 0;
                if (count === 0) return null;

                return (
                  <Card 
                    key={key}
                    className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-gray-100 hover:border-blue-300"
                    onClick={() => navigate(createPageUrl("FAQ") + `?category=${key}`)}
                  >
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 ${config.color} rounded-xl flex items-center justify-center mb-4`}>
                        {React.createElement(config.icon, {
                          className: "w-7 h-7 text-white"
                        })}
                      </div>
                      <h3 className="font-bold text-xl text-gray-900 mb-2">
                        {language === 'es' ? config.label_es : config.label_en}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {count} {language === 'es' ? 'artículos' : 'articles'}
                      </p>
                      <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0">
                        {language === 'es' ? 'Ver artículos' : 'View articles'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 border-2 border-blue-200">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {language === 'es' ? '¿No encuentras lo que buscas?' : "Can't find what you're looking for?"}
              </h3>
              <p className="text-gray-700 mb-6">
                {language === 'es' 
                  ? 'Nuestro equipo de soporte está aquí para ayudarte'
                  : 'Our support team is here to help you'}
              </p>
              <a href="mailto:soporte@misautonomos.es">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  {language === 'es' ? 'Contactar soporte' : 'Contact support'}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}