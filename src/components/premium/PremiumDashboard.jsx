import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Eye,
  MessageSquare,
  Search,
  TrendingUp,
  Star,
  Crown,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Sparkles
} from "lucide-react";
import { useLanguage } from "../ui/LanguageSwitcher";

export default function PremiumDashboard({ metrics, subscription, profile }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const hasActiveSubscription = subscription && 
    ['activo', 'active', 'en_prueba', 'trialing'].some(s => 
      subscription.estado?.toLowerCase().includes(s)
    );

  const last30DaysMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        totalViews: 0,
        totalMessages: 0,
        totalSearches: 0,
        totalContacts: 0,
        avgViewsPerDay: 0,
        trend: 0
      };
    }

    const sortedMetrics = [...metrics].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    ).slice(0, 30);

    const totalViews = sortedMetrics.reduce((sum, m) => sum + (m.profile_views || 0), 0);
    const totalMessages = sortedMetrics.reduce((sum, m) => sum + (m.messages_received || 0), 0);
    const totalSearches = sortedMetrics.reduce((sum, m) => sum + (m.search_appearances || 0), 0);
    const totalContacts = sortedMetrics.reduce((sum, m) => sum + (m.contact_clicks || 0), 0);

    const recent15 = sortedMetrics.slice(0, 15);
    const previous15 = sortedMetrics.slice(15, 30);
    
    const recentAvg = recent15.reduce((sum, m) => sum + (m.profile_views || 0), 0) / 15;
    const previousAvg = previous15.reduce((sum, m) => sum + (m.profile_views || 0), 0) / 15;
    
    const trend = previousAvg > 0 
      ? ((recentAvg - previousAvg) / previousAvg) * 100 
      : recentAvg > 0 ? 100 : 0;

    return {
      totalViews,
      totalMessages,
      totalSearches,
      totalContacts,
      avgViewsPerDay: totalViews / 30,
      trend: Math.round(trend)
    };
  }, [metrics]);

  const profileCompleteness = useMemo(() => {
    if (!profile) return { percentage: 0, missing: [] };
    
    const checks = [
      { key: 'business_name', label: 'Nombre profesional', weight: 10 },
      { key: 'descripcion_corta', label: 'Descripción corta', weight: 15 },
      { key: 'description', label: 'Descripción detallada', weight: 10 },
      { key: 'categories', label: 'Categorías', weight: 10, check: (v) => v && v.length > 0 },
      { key: 'photos', label: 'Fotos de trabajos', weight: 15, check: (v) => v && v.length >= 3 },
      { key: 'telefono_contacto', label: 'Teléfono', weight: 10 },
      { key: 'service_area', label: 'Zona de servicio', weight: 10 },
      { key: 'formas_pago', label: 'Formas de pago', weight: 10, check: (v) => v && v.length > 0 },
      { key: 'years_experience', label: 'Años de experiencia', weight: 5 },
      { key: 'certifications', label: 'Certificaciones', weight: 5, check: (v) => v && v.length > 0 }
    ];

    let completed = 0;
    const missing = [];

    checks.forEach(check => {
      const value = profile[check.key];
      const isComplete = check.check 
        ? check.check(value)
        : value !== undefined && value !== null && value !== '';
      
      if (isComplete) {
        completed += check.weight;
      } else {
        missing.push({ label: check.label, weight: check.weight });
      }
    });

    return { percentage: completed, missing };
  }, [profile]);

  const premiumFeatures = [
    {
      icon: Star,
      title: "Perfil destacado",
      description: "Aparece en las primeras posiciones de búsqueda",
      active: hasActiveSubscription
    },
    {
      icon: Crown,
      title: "Badge Premium",
      description: "Insignia visible que genera confianza",
      active: hasActiveSubscription
    },
    {
      icon: BarChart3,
      title: "Estadísticas avanzadas",
      description: "Métricas detalladas de tu perfil",
      active: hasActiveSubscription
    },
    {
      icon: Sparkles,
      title: "Mayor visibilidad",
      description: "Multiplica tus oportunidades de negocio",
      active: hasActiveSubscription
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Panel Premium</h2>
              <p className="text-blue-100">
                {hasActiveSubscription 
                  ? "Disfruta de todas las ventajas de tu plan"
                  : "Mejora tu plan para desbloquear todas las funciones"}
              </p>
            </div>
            {hasActiveSubscription && (
              <Badge className="bg-amber-500 text-amber-900 text-lg px-4 py-2">
                <Crown className="w-5 h-5 mr-2" />
                Premium
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {hasActiveSubscription ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-8 h-8 text-blue-600" />
                {last30DaysMetrics.trend !== 0 && (
                  <Badge className={last30DaysMetrics.trend > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {last30DaysMetrics.trend > 0 ? '+' : ''}{last30DaysMetrics.trend}%
                  </Badge>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900">{last30DaysMetrics.totalViews}</p>
              <p className="text-sm text-gray-600">Visitas al perfil (30 días)</p>
              <p className="text-xs text-gray-500 mt-1">
                ~{Math.round(last30DaysMetrics.avgViewsPerDay)} por día
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{last30DaysMetrics.totalMessages}</p>
              <p className="text-sm text-gray-600">Mensajes recibidos</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{last30DaysMetrics.totalSearches}</p>
              <p className="text-sm text-gray-600">Apariciones en búsqueda</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{last30DaysMetrics.totalContacts}</p>
              <p className="text-sm text-gray-600">Clics en contacto</p>
              <p className="text-xs text-gray-500 mt-1">Teléfono, WhatsApp, etc.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-2 border-gray-200">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Desbloquea tus estadísticas
            </h3>
            <p className="text-gray-600 mb-6">
              Con un plan premium podrás ver todas tus métricas y optimizar tu perfil
            </p>
            <Button 
              onClick={() => navigate(createPageUrl("PricingPlans"))}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ver planes premium
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Completitud del perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">
                  {profileCompleteness.percentage}% completo
                </span>
                <span className="text-sm text-gray-500">
                  {profileCompleteness.percentage >= 90 ? '¡Excelente!' : 
                   profileCompleteness.percentage >= 70 ? 'Buen progreso' : 
                   'Añade más información'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    profileCompleteness.percentage >= 90 ? 'bg-green-500' :
                    profileCompleteness.percentage >= 70 ? 'bg-blue-500' :
                    'bg-amber-500'
                  }`}
                  style={{ width: `${profileCompleteness.percentage}%` }}
                />
              </div>
            </div>

            {profileCompleteness.missing.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Completa estos elementos para mejorar tu visibilidad:
                </p>
                {profileCompleteness.missing.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    {item.label}
                  </div>
                ))}
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate(createPageUrl("MyProfile"))}
            >
              Editar perfil
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Ventajas de tu plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {premiumFeatures.map((feature, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    feature.active ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    feature.active ? 'bg-blue-100' : 'bg-gray-200'
                  }`}>
                    <feature.icon className={`w-5 h-5 ${
                      feature.active ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      {feature.active && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {!hasActiveSubscription && (
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-800"
                onClick={() => navigate(createPageUrl("PricingPlans"))}
              >
                <Crown className="w-4 h-4 mr-2" />
                Activar plan premium
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Consejos para destacar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">📸 Añade más fotos</h4>
              <p className="text-sm text-blue-800">
                Los perfiles con 5+ fotos reciben un 80% más de contactos
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">⚡ Responde rápido</h4>
              <p className="text-sm text-green-800">
                Responder en menos de 1 hora mejora tu posicionamiento
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">⭐ Pide valoraciones</h4>
              <p className="text-sm text-amber-800">
                Las valoraciones aumentan la confianza y las conversiones
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}