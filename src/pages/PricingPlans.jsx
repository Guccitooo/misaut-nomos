import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Gift, ArrowLeft, Zap, TrendingUp, Crown, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";

export default function PricingPlansPage() {
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
      
      allPlans.forEach(plan => {
        if (plan.plan_id === 'plan_monthly_trial' || 
            plan.plan_id === 'plan_quarterly' || 
            plan.plan_id === 'plan_annual') {
          const existingPlan = planMap.get(plan.plan_id);
          if (!existingPlan || new Date(plan.updated_date) > new Date(existingPlan.updated_date)) {
            planMap.set(plan.plan_id, plan);
          }
        }
      });
      
      return Array.from(planMap.values()).sort((a, b) => a.precio - b.precio);
    },
    initialData: [],
    staleTime: 0,
    cacheTime: 0,
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
      const response = await base44.functions.invoke('createCheckoutSession', {
        planId: plan.plan_id,
        planPrice: plan.precio,
        isReactivation: false
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No se pudo crear la sesión de pago');
      }
    } catch (err) {
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
      case "plan_monthly_trial": return <Zap className="w-10 h-10" />;
      case "plan_quarterly": return <TrendingUp className="w-10 h-10" />;
      case "plan_annual": return <Crown className="w-10 h-10" />;
      default: return <CheckCircle className="w-10 h-10" />;
    }
  };

  const getPlanBadge = (planId) => {
    switch (planId) {
      case "plan_monthly_trial": 
        return { text: "2 meses gratis", color: "bg-blue-500" };
      case "plan_quarterly": 
        return { text: "Más popular", color: "bg-green-500" };
      case "plan_annual": 
        return { text: "Mejor valor", color: "bg-orange-500" };
      default: 
        return null;
    }
  };

  const getPlanFeatures = () => [
    "✅ Aparece en búsquedas",
    "💬 Chat directo con clientes",
    "📋 CRM completo para clientes",
    "📄 Sistema de facturación",
    "💳 Pasarela de pago integrada",
    "🎫 Soporte 24/7 vía tickets",
    "⭐ Sistema de valoraciones",
    "📸 Galería de fotos ilimitada",
    "🔧 Gestión de trabajos",
    "❌ Cancela cuando quieras"
  ];

  if (loadingPlans) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Planes y Precios - MisAutónomos | 2 Meses Gratis"
        description="Elige tu plan: Mensual 33€, Trimestral 89€ (10% off), Anual 316€ (20% off). Todos con 2 meses gratis. Sin permanencia."
        keywords="planes autónomos, precios profesionales, 2 meses gratis, suscripción mensual, plan anual"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-6 hover:bg-blue-50"
            aria-label="Volver"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-full text-lg font-bold mb-6 shadow-lg">
                <Gift className="w-6 h-6" />
                2 MESES GRATIS
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">
                Empieza gratis hoy
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Sin permanencia • Cancela cuando quieras • Pago 100% seguro
              </p>
            </div>

          {canceled && (
            <Alert className="mb-6 max-w-2xl mx-auto bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Pago cancelado. No te preocupes, puedes volver cuando quieras.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => {
              const badge = getPlanBadge(plan.plan_id);
              const isPopular = plan.plan_id === "plan_quarterly";
              
              return (
                <Card 
                  key={plan.plan_id}
                  className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-white ${
                    isPopular ? "border-green-500 shadow-xl" : "border-gray-200"
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
                        plan.plan_id === "plan_monthly_trial" ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" :
                        plan.plan_id === "plan_quarterly" ? "bg-gradient-to-br from-green-500 to-green-600 text-white" :
                        "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
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
                          primeros 2 meses
                        </p>
                        <p className="text-sm text-gray-500 mt-3">
                          Luego {Math.round(plan.precio)}€
                          {plan.plan_id === "plan_monthly_trial" ? "/mes" : 
                           plan.plan_id === "plan_quarterly" ? " cada 3 meses" : 
                           "/año"}
                        </p>
                      </div>

                      {plan.plan_id !== "plan_monthly_trial" && (
                        <div className="mt-3 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <p className="text-sm font-bold text-green-700">
                            {plan.plan_id === "plan_quarterly" && "💰 Ahorra 10% - Solo 30€/mes"}
                            {plan.plan_id === "plan_annual" && "🎉 Ahorra 20% - Solo 26€/mes"}
                          </p>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {getPlanFeatures().map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full h-12 text-base font-bold transition-all ${
                        isPopular 
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg" 
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isProcessing && selectedPlan === plan.plan_id}
                      aria-label={`Seleccionar plan ${plan.nombre}`}
                    >
                      {isProcessing && selectedPlan === plan.plan_id ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Empezar ahora"
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500 mt-3">
                      Al hacer clic, irás al checkout seguro de Stripe
                    </p>
                  </CardContent>
                </Card>
              );
            })}
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
                      <h3 className="font-bold text-gray-900 mb-2">¿Qué pasa después de los 2 meses?</h3>
                      <p className="text-sm text-gray-600">
                        Se cobrará automáticamente según el plan elegido. Puedes cancelar antes sin coste.
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
                      <h3 className="font-bold text-gray-900 mb-2">¿Puedo cancelar cuando quiera?</h3>
                      <p className="text-sm text-gray-600">
                        Sí, sin permanencia. Cancela antes de los 60 días y no pagas nada.
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