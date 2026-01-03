import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Gift, ArrowLeft, Zap, TrendingUp, Crown, Info, Shield, Star, Users, Clock, ArrowRight, Briefcase } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";
import SubscriptionProductSchema from "../components/seo/SubscriptionProductSchema";
import { useLanguage } from "../components/ui/LanguageSwitcher";


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
        return { text: "⭐ EL PLAN QUE MÁS CLIENTES GENERA", color: "bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse" };
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
      
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-6 hover:bg-blue-50"
            aria-label={t('back')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Button>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
              Planes y Precios
            </h1>
            <p className="text-base text-gray-600">
              Prueba gratis durante 7 días. Sin permanencia.
            </p>
          </div>

          {canceled && (
            <Alert className="mb-6 max-w-2xl mx-auto bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                {t('paymentCanceled')}
              </AlertDescription>
            </Alert>
          )}

          {/* Plan cards estilo Apple/Stripe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {plans.map((plan) => {
              const isGrowth = plan.plan_id === "plan_growth";

              return (
                <Card 
                  key={plan.plan_id}
                  className="relative bg-white border border-gray-200 hover:shadow-sm transition-all duration-200"
                  style={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                  {isGrowth && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gray-900 text-white text-xs font-medium px-4 py-1 rounded-full">
                        MÁS RENTABLE
                      </span>
                    </div>
                  )}

                  <CardContent className="p-10">
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        {plan.nombre}
                      </h3>

                      <div className="mb-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-semibold text-gray-900 tracking-tight">
                            {Math.round(plan.precio)}€
                          </span>
                          <span className="text-lg text-gray-500">/mes</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Luego {Math.round(plan.precio)}€/mes
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 text-sm text-gray-700">
                      {plan.plan_id === "plan_profesional" ? (
                        <>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>Visibilidad en directorio</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>Perfil verificado</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>Gestión de facturas</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>Chat con clientes</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-gray-900 flex-shrink-0" />
                            <span className="font-medium">Incluye 20€/mes en Ads</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-gray-900 flex-shrink-0" />
                            <span className="font-medium">Posición TOP 1</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-gray-900 flex-shrink-0" />
                            <span className="font-medium">Soporte VIP</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-gray-900 flex-shrink-0" />
                            <span className="font-medium">Informes de clics</span>
                          </li>
                        </>
                      )}
                    </ul>

                    <Button
                      className="w-full h-11 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white transition-colors"
                      style={{ borderRadius: '8px' }}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isProcessing && selectedPlan === plan.plan_id}
                      aria-label={`Seleccionar plan ${plan.nombre}`}
                    >
                      {isProcessing && selectedPlan === plan.plan_id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Empieza 7 días gratis"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>





          {/* Sección de exclusividad */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="border-t border-gray-200 pt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                <div>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-gray-300 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-900 font-medium mb-1">
                    Plazas limitadas
                  </p>
                  <p className="text-xs text-gray-600">
                    Solo 10 profesionales por ciudad/categoría
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-gray-300 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-900 font-medium mb-1">
                    Garantía de calidad
                  </p>
                  <p className="text-xs text-gray-600">
                    Expulsión automática si baja la calidad
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              Después de los 7 días gratis se cobrará automáticamente. Puedes cancelar en cualquier momento. 
              Plan Growth: Los 20€/mes se destinan a anuncios en Meta Ads. Resultados sujetos a demanda local.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}