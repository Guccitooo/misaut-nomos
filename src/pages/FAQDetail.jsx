import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Share2,
  BookOpen,
  Users,
  Briefcase,
  Shield,
  CreditCard,
  User,
  AlertCircle,
  Clock,
  Eye
} from "lucide-react";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";
import { FAQPageSchema } from "../components/seo/StructuredData";
import { toast } from "sonner";

const categoryConfig = {
  platform: { icon: BookOpen, color: "bg-blue-500", label_es: "Sobre la plataforma", label_en: "About the platform" },
  clients: { icon: Users, color: "bg-green-500", label_es: "Para clientes", label_en: "For clients" },
  professionals: { icon: Briefcase, color: "bg-blue-600", label_es: "Para autónomos", label_en: "For professionals" },
  security: { icon: Shield, color: "bg-amber-500", label_es: "Seguridad", label_en: "Security" },
  payments: { icon: CreditCard, color: "bg-green-600", label_es: "Pagos y suscripciones", label_en: "Payments & subscriptions" },
  profile: { icon: User, color: "bg-blue-500", label_es: "Perfil profesional", label_en: "Professional profile" },
  troubleshooting: { icon: AlertCircle, color: "bg-red-500", label_es: "Resolución de problemas", label_en: "Troubleshooting" }
};

export default function FAQDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [hasVoted, setHasVoted] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const faqId = urlParams.get("id");

  const { data: faq, isLoading } = useQuery({
    queryKey: ['faq', faqId],
    queryFn: async () => {
      const faqs = await base44.entities.FAQ.filter({ id: faqId });
      if (faqs.length === 0) return null;
      
      await base44.entities.FAQ.update(faqId, {
        views: (faqs[0].views || 0) + 1
      });
      
      const recentViews = JSON.parse(localStorage.getItem('recentFaqViews') || '[]');
      const newRecent = [
        { id: faqs[0].id, title: language === 'es' ? faqs[0].title_es : faqs[0].title_en, timestamp: Date.now() },
        ...recentViews.filter(v => v.id !== faqs[0].id)
      ].slice(0, 5);
      localStorage.setItem('recentFaqViews', JSON.stringify(newRecent));
      
      return faqs[0];
    },
    enabled: !!faqId,
  });

  const { data: relatedFaqs = [] } = useQuery({
    queryKey: ['relatedFaqs', faq?.category, faqId],
    queryFn: async () => {
      if (!faq) return [];
      
      const allFaqs = await base44.entities.FAQ.filter({
        category: faq.category,
        published: true
      });
      
      return allFaqs
        .filter(f => f.id !== faqId)
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 3);
    },
    enabled: !!faq,
  });

  const [recentViews, setRecentViews] = useState([]);

  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentFaqViews') || '[]');
    setRecentViews(recent.filter(v => v.id !== faqId));
  }, [faqId]);

  const markHelpfulMutation = useMutation({
    mutationFn: async (helpful) => {
      await base44.entities.FAQ.update(faqId, {
        helpful_count: (faq.helpful_count || 0) + (helpful ? 1 : -1)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq', faqId] });
      setHasVoted(true);
      toast.success(language === 'es' ? '¡Gracias por tu feedback!' : 'Thanks for your feedback!');
    },
  });

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: language === 'es' ? faq.title_es : faq.title_en,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success(language === 'es' ? 'Enlace copiado' : 'Link copied');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">{language === 'es' ? 'Cargando...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!faq) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'es' ? 'Artículo no encontrado' : 'Article not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {language === 'es' 
              ? 'El artículo que buscas no existe o ha sido eliminado.'
              : 'The article you are looking for does not exist or has been deleted.'}
          </p>
          <Button onClick={() => navigate(createPageUrl("HelpCenter"))}>
            {language === 'es' ? 'Volver al centro de ayuda' : 'Back to help center'}
          </Button>
        </Card>
      </div>
    );
  }

  const getCategoryLabel = (category) => {
    return language === 'es' 
      ? categoryConfig[category]?.label_es 
      : categoryConfig[category]?.label_en;
  };

  // Schema FAQ con campos name y text correctos
  const faqSchemaData = [{
    question: language === 'es' ? faq.title_es : faq.title_en,
    answer: language === 'es' ? (faq.content_es || faq.summary_es) : (faq.content_en || faq.summary_en)
  }];

  return (
    <>
      <SEOHead 
        title={`${language === 'es' ? faq.title_es : faq.title_en} - MisAutónomos`}
        description={language === 'es' ? faq.summary_es : faq.summary_en}
        type="article"
        publishedTime={faq.created_date}
        modifiedTime={faq.updated_date}
      />
      
      {/* Schema JSON-LD para FAQPage */}
      <FAQPageSchema faqs={faqSchemaData} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6 flex-wrap">
            <Link to={createPageUrl("HelpCenter")} className="hover:text-blue-600 flex items-center gap-1">
              <Home className="w-4 h-4" />
              {language === 'es' ? 'Centro de Ayuda' : 'Help Center'}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={createPageUrl("FAQ")} className="hover:text-blue-600">
              {language === 'es' ? 'Preguntas Frecuentes' : 'FAQs'}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium line-clamp-1">
              {language === 'es' ? faq.title_es : faq.title_en}
            </span>
          </nav>

          <Card className="mb-6 border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-10 h-10 ${categoryConfig[faq.category]?.color} rounded-lg flex items-center justify-center`}>
                  {React.createElement(categoryConfig[faq.category]?.icon || BookOpen, {
                    className: "w-5 h-5 text-white"
                  })}
                </div>
                <Badge variant="outline" className="text-sm">
                  {getCategoryLabel(faq.category)}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {language === 'es' ? faq.title_es : faq.title_en}
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{faq.views || 0} {language === 'es' ? 'vistas' : 'views'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {language === 'es' ? 'Actualizado' : 'Updated'}{' '}
                    {new Date(faq.updated_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                  </span>
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                  {language === 'es' ? faq.summary_es : faq.summary_en}
                </p>

                <div 
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: (language === 'es' ? faq.content_es : faq.content_en)
                      .split('\n')
                      .map(p => p.trim() ? `<p class="mb-4">${p}</p>` : '')
                      .join('') 
                  }}
                />
              </div>

              {faq.tags && faq.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    {language === 'es' ? 'Etiquetas:' : 'Tags:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {faq.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-700 font-semibold mb-4">
                  {language === 'es' ? '¿Te ha sido útil este artículo?' : 'Was this article helpful?'}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => markHelpfulMutation.mutate(true)}
                    disabled={hasVoted}
                    className="hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Sí' : 'Yes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => markHelpfulMutation.mutate(false)}
                    disabled={hasVoted}
                    className="hover:bg-red-50 hover:border-red-500 hover:text-red-700"
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'No' : 'No'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="ml-auto"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Compartir' : 'Share'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {relatedFaqs.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {language === 'es' ? 'Artículos relacionados' : 'Related articles'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedFaqs.map((related) => (
                  <Card 
                    key={related.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-100 hover:border-blue-200"
                    onClick={() => navigate(createPageUrl("FAQDetail") + `?id=${related.id}`)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-700">
                        {language === 'es' ? related.title_es : related.title_en}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {language === 'es' ? related.summary_es : related.summary_en}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {recentViews.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {language === 'es' ? 'Vistos recientemente' : 'Recently viewed'}
              </h2>
              <div className="space-y-2">
                {recentViews.map((recent) => (
                  <Card 
                    key={recent.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl("FAQDetail") + `?id=${recent.id}`)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="text-gray-900 font-medium">{recent.title}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}