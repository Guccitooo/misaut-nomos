import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Home,
  Filter,
  X
} from "lucide-react";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";
import { FAQPageSchema } from "../components/seo/StructuredData";

const categoryConfig = {
  platform: { icon: BookOpen, color: "bg-blue-500", label_es: "Sobre la plataforma", label_en: "About the platform" },
  clients: { icon: Users, color: "bg-green-500", label_es: "Para clientes", label_en: "For clients" },
  professionals: { icon: Briefcase, color: "bg-blue-600", label_es: "Para autónomos", label_en: "For professionals" },
  security: { icon: Shield, color: "bg-amber-500", label_es: "Seguridad", label_en: "Security" },
  payments: { icon: CreditCard, color: "bg-green-600", label_es: "Pagos y suscripciones", label_en: "Payments & subscriptions" },
  profile: { icon: User, color: "bg-blue-500", label_es: "Perfil profesional", label_en: "Professional profile" },
  troubleshooting: { icon: AlertCircle, color: "bg-red-500", label_es: "Resolución de problemas", label_en: "Troubleshooting" }
};

export default function FAQPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    new URLSearchParams(window.location.search).get("category") || "all"
  );

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const allFaqs = await base44.entities.FAQ.filter({ published: true });
      return allFaqs.sort((a, b) => (a.order || 0) - (b.order || 0));
    },
  });

  const filteredFaqs = useMemo(() => {
    let filtered = faqs;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(faq => {
        const title = language === 'es' ? faq.title_es : faq.title_en;
        const content = language === 'es' ? faq.content_es : faq.content_en;
        const summary = language === 'es' ? faq.summary_es : faq.summary_en;
        
        return title.toLowerCase().includes(searchLower) ||
               content.toLowerCase().includes(searchLower) ||
               summary.toLowerCase().includes(searchLower) ||
               faq.tags.some(tag => tag.toLowerCase().includes(searchLower));
      });
    }

    return filtered;
  }, [faqs, selectedCategory, searchTerm, language]);

  const getCategoryLabel = (category) => {
    return language === 'es' 
      ? categoryConfig[category]?.label_es 
      : categoryConfig[category]?.label_en;
  };

  const faqsByCategory = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  // Preparar FAQs para el schema JSON-LD con campos correctos
  const faqSchemaData = filteredFaqs.map(faq => ({
    question: language === 'es' ? faq.title_es : faq.title_en,
    answer: language === 'es' ? (faq.summary_es || faq.content_es) : (faq.summary_en || faq.content_en)
  }));

  return (
    <>
      <SEOHead 
        title={language === 'es' ? "Preguntas Frecuentes - MisAutónomos" : "Frequently Asked Questions - MisAutónomos"}
        description={language === 'es' 
          ? "Todas las respuestas a tus preguntas sobre MisAutónomos en un solo lugar."
          : "All answers to your questions about MisAutónomos in one place."}
      />
      
      {/* Schema JSON-LD para FAQPage */}
      <FAQPageSchema faqs={faqSchemaData} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link to={createPageUrl("HelpCenter")} className="hover:text-blue-600 flex items-center gap-1">
              <Home className="w-4 h-4" />
              {language === 'es' ? 'Centro de Ayuda' : 'Help Center'}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">
              {language === 'es' ? 'Preguntas Frecuentes' : 'FAQs'}
            </span>
          </nav>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {language === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
            </h1>
            <p className="text-xl text-gray-600">
              {language === 'es' 
                ? 'Encuentra respuestas rápidas a las preguntas más comunes'
                : 'Find quick answers to the most common questions'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">
                      {language === 'es' ? 'Filtrar' : 'Filter'}
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === "all"
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {language === 'es' ? 'Todas las categorías' : 'All categories'}
                    </button>
                    
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          selectedCategory === key
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {React.createElement(config.icon, {
                          className: "w-4 h-4"
                        })}
                        <span className="flex-1">{language === 'es' ? config.label_es : config.label_en}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {faqs.filter(f => f.category === key).length}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder={language === 'es' ? "Buscar preguntas..." : "Search questions..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {selectedCategory !== "all" && (
                <div className="mb-6 flex items-center gap-2">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    {getCategoryLabel(selectedCategory)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                  >
                    {language === 'es' ? 'Limpiar filtro' : 'Clear filter'}
                  </Button>
                </div>
              )}

              {filteredFaqs.length === 0 ? (
                <Card className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {language === 'es' ? 'No se encontraron resultados' : 'No results found'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {language === 'es' 
                      ? 'Intenta con otros términos de búsqueda o categoría'
                      : 'Try different search terms or category'}
                  </p>
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                    }}
                  >
                    {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {selectedCategory === "all" ? (
                    Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
                      <div key={category}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 ${categoryConfig[category]?.color} rounded-lg flex items-center justify-center`}>
                            {React.createElement(categoryConfig[category]?.icon || BookOpen, {
                              className: "w-5 h-5 text-white"
                            })}
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {getCategoryLabel(category)}
                          </h2>
                        </div>
                        <div className="space-y-3">
                          {categoryFaqs.map((faq) => (
                            <Card 
                              key={faq.id}
                              className="hover:shadow-md transition-shadow cursor-pointer border-2 border-gray-100 hover:border-blue-200"
                              onClick={() => navigate(createPageUrl("FAQDetail") + `?id=${faq.id}`)}
                            >
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-2 hover:text-blue-700">
                                      {language === 'es' ? faq.title_es : faq.title_en}
                                    </h3>
                                    <p className="text-gray-600 line-clamp-2">
                                      {language === 'es' ? faq.summary_es : faq.summary_en}
                                    </p>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-3">
                      {filteredFaqs.map((faq) => (
                        <Card 
                          key={faq.id}
                          className="hover:shadow-md transition-shadow cursor-pointer border-2 border-gray-100 hover:border-blue-200"
                          onClick={() => navigate(createPageUrl("FAQDetail") + `?id=${faq.id}`)}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900 mb-2 hover:text-blue-700">
                                  {language === 'es' ? faq.title_es : faq.title_en}
                                </h3>
                                <p className="text-gray-600 line-clamp-2">
                                  {language === 'es' ? faq.summary_es : faq.summary_en}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}