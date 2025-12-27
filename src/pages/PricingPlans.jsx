import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Gift, ArrowLeft, Zap, TrendingUp, Crown, Info, Shield, Star, Users, Clock, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";
import SubscriptionProductSchema from "../components/seo/SubscriptionProductSchema";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import ProFeaturesSection from "../components/pricing/ProFeaturesSection";

export default function PricingPlansPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canceled = searchParams.get("canceled");

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const allPlans = await base44.entities.SubscriptionPlan.list();
      const planMap = new Map();
      
      const validPlanIds = ['plan_profesional', 'plan_growth'];
      
      allPlans.forEach(plan => {
        if (validPlanIds.includes(plan.plan_id)) {
          const existingPlan = planMap.get(plan.plan_id);
          if (!existingPlan || new Date(plan.updated_date) > new Date(existingPlan.updated_date)) {
            planMap.set(plan.plan_id, plan);
          }
        }
      });
      
      return Array.from(planMap.values()).sort((a, b) => a.precio - b.precio);
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (canceled) {
      toast.info("Pago cancelado. Puedes volver a elegir un plan cuando quieras.", {
        duration: 5000
      });
    }
  }, [canceled]);

  useEffect(() => {
    if (!user || plans.length === 0) return;

    const pendingPlan = localStorage.getItem('pending_plan_selection');
    if (pendingPlan) {
      try {
        const planData = JSON.parse(pendingPlan);
        localStorage.removeItem('pending_plan_selection');
        
        const fullPlan = plans.find(p => p.plan_id === planData.plan_id);
        
        if (fullPlan) {
          handleSelectPlan(fullPlan);
        }
      } catch (error) {
        localStorage.removeItem('pending_plan_selection');
      }
    }
  }, [user, plans]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const handleSelectPlan = async (plan) => {
    if (!user) {
      localStorage.setItem('pending_plan_selection', JSON.stringify({
        plan_id: plan.plan_id,
        precio: plan.precio,
        timestamp: Date.now()
      }));
      
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setSelectedPlan(plan.plan_id);
    setIsProcessing(true);

    try {
      console.log('🛒 Creando sesión de checkout para plan:', plan.plan_id);
      
      const response = await base44.functions.invoke('createCheckoutSession', {
        planId: plan.plan_id,
        planPrice: plan.precio,
        isReactivation: false
      });

      console.log('📦 Respuesta del servidor:', response);

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (response.data?.url) {
        console.log('✅ Redirigiendo a Stripe:', response.data.url);
        // Redirección inmediata sin timeout
        window.location.href = response.data.url;
      } else if (response.data?.sessionId) {
        console.log('✅ Session ID recibido, redirigiendo...');
        // Fallback: usar sessionId si no hay URL directa
        window.location.href = `https://checkout.stripe.com/pay/${response.data.sessionId}`;
      } else {
        console.error('❌ Sin URL en respuesta:', response);
        throw new Error('No se pudo crear la sesión de pago');
      }
    } catch (err) {
      console.error('❌ Error en handleSelectPlan:', err);
      toast.error(err.message || "Error al procesar el pago. Inténtalo de nuevo.");
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleGoBack = () => {
    navigate(createPageUrl("Search"));
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case "plan_profesional": return <Briefcase className="w-10 h-10" />;
      case "plan_growth": return <TrendingUp className="w-10 h-10" />;
      default: return <CheckCircle className="w-10 h-10" />;
    }
  };

  const getPlanBadge = (planId) => {
    switch (planId) {
      case "plan_profesional": 
        return { text: "Más popular", color: "bg-green-500" };
      case "plan_growth": 
        return { text: "Crecimiento", color: "bg-purple-500" };
      default: 
        return null;
    }
  };

  const getPlanFeatures = () => [
    `✅ ${t('appearInSearches')}`,
    `💬 ${t('directChatWithClients')}`,
    `📋 ${t('completeCRM')}`,
    `📄 ${t('invoicingSystem')}`,
    `💳 ${t('integratedPaymentGateway')}`,
    `🎫 ${t('support247')}`,
    `⭐ ${t('ratingsSystem')}`,
    `📸 ${t('unlimitedPhotoGallery')}`,
    `🔧 ${t('jobManagement')}`,
    `❌ ${t('cancelAnytime')}`
  ];

  if (loadingPlans) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!loadingPlans && plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <div className="text-center">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('noPlansAvailable')}</h2>
          <p className="text-gray-600 mb-4">{t('plansBeingConfigured')}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            {t('reloadPage')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Planes y Precios - MisAutónomos | 7 Días Gratis"
        description="Elige tu plan: Mensual 33€, Trimestral 89€ (10% off), Anual 316€ (20% off). Todos con 7 días gratis. Sin permanencia."
        keywords="planes autónomos, precios profesionales, 7 días gratis, suscripción mensual, plan anual"
      />
      <SubscriptionProductSchema plans={plans} />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-6 hover:bg-blue-50"
            aria-label={t('back')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Button>

          {/* Hero Section mejorado */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-full text-lg font-bold mb-6 shadow-lg animate-pulse">
              <Gift className="w-6 h-6" />
              {t('sevenDaysTrial')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-tight">
              {t('startFreeToday')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
              {t('noCommitment')} • {t('cancelAnytime')} • {t('securePayment')}
            </p>
            
            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Pago 100% seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>+5.000 búsquedas/día</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>Activo en minutos</span>
              </div>
            </div>
          </div>

          {canceled && (
            <Alert className="mb-6 max-w-2xl mx-auto bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                {t('paymentCanceled')}
              </AlertDescription>
            </Alert>
          )}

          {/* Plan cards con diseño mejorado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {plans.map((plan) => {
              const badge = getPlanBadge(plan.plan_id);
              const isPopular = plan.plan_id === "plan_profesional";

              return (
                <Card 
                  key={plan.plan_id}
                  className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white rounded-2xl ${
                    isPopular ? "border-green-500 shadow-xl scale-105 z-10" : "border-gray-200"
                  }`}
                >
                  {badge && (
                    <div className="absolute top-0 left-0 right-0">
                      <div className={`${badge.color} text-white text-center py-2 text-sm font-bold`}>
                        {badge.text}
                      </div>
                    </div>
                  )}

                  <CardContent className={`p-6 ${badge ? 'pt-14' : 'pt-6'}`}>
                    <div className="text-center mb-6">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
                        plan.plan_id === "plan_profesional" ? "bg-gradient-to-br from-green-500 to-green-600 text-white" :
                        "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                      }`}>
                        {getPlanIcon(plan.plan_id)}
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {plan.nombre}
                      </h3>

                      <div className="mb-3">
                        <p className="text-6xl font-black text-gray-900">
                          0€
                        </p>
                        <p className="text-lg text-gray-600 font-semibold mt-2">
                          {t('firstSevenDays')}
                        </p>
                        <p className="text-sm text-gray-500 mt-3">
                          {t('then')} {Math.round(plan.precio)}€{t('perMonth')}
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.plan_id === "plan_profesional" ? (
                        <>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">✅ {t('appearInSearches')}</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">💬 {t('directChatWithClients')}</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">📋 {t('completeCRM')}</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">📄 {t('invoicingSystem')}</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">💳 {t('integratedPaymentGateway')}</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">🎫 {t('support247')}</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">⭐ {t('ratingsSystem')}</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">📸 {t('unlimitedPhotoGallery')}</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">❌ {t('cancelAnytime')}</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">✅ Todo lo del Plan Profesional</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">🚀 20€/mes en anuncios de Meta Ads gestionados</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">📊 Análisis y optimización de campañas</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">🎯 Segmentación avanzada de audiencias</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">📈 Mayor visibilidad y más clientes</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">💼 Gestor de anuncios dedicado</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs">
                            <span className="text-gray-700">❌ {t('cancelAnytime')}</span>
                          </li>
                        </>
                      )}
                    </ul>

                    <Button
                      className={`w-full h-12 text-base font-bold transition-all ${
                        isPopular 
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg" 
                          : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                      }`}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isProcessing && selectedPlan === plan.plan_id}
                      aria-label={`Seleccionar plan ${plan.nombre}`}
                    >
                      {isProcessing && selectedPlan === plan.plan_id ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {t('processing')}
                        </>
                      ) : (
                        t('startNow')
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500 mt-3">
                      {t('clickGoToCheckout')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pro Features Section */}
          <div className="mb-12">
            <ProFeaturesSection />
          </div>

          {/* Comparación de planes */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">¿Cuál es la diferencia?</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Característica</th>
                    <th className="px-6 py-4 text-center text-white font-semibold">Profesional</th>
                    <th className="px-6 py-4 text-center text-white font-semibold">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">Aparecer en búsquedas</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">Chat directo con clientes</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">CRM + Facturación</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">Sistema de valoraciones</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-purple-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">🚀 Anuncios en Meta Ads (20€/mes gestionados)</td>
                    <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-purple-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-purple-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">📊 Análisis y optimización de campañas</td>
                    <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-purple-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-purple-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">🎯 Mayor alcance y visibilidad</td>
                    <td className="px-6 py-4 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-purple-600 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-12 text-white text-center">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h3 className="text-2xl font-bold mb-2">
              Miles de Clientes te Verán Cada Día
            </h3>
            <p className="text-blue-100 max-w-2xl mx-auto">
              Aumenta tu visibilidad al instante. Consigue más oportunidades de trabajo con tu perfil profesional.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">{t('whatHappensAfterTrial')}</h3>
                      <p className="text-sm text-gray-600">
                        {t('autoChargeExplain')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">{t('canCancelAnytime')}</h3>
                      <p className="text-sm text-gray-600">
                        {t('noPermanenceExplain')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}