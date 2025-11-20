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
    "Aparece en búsquedas",
    "Perfil profesional completo",
    "Chat directo con clientes",
    "Recibe valoraciones",
    "Galería de fotos ilimitada",
    "Soporte preferente",
    "Cancela cuando quieras"
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
      
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-4 text-white hover:bg-white/10 border border-white/20"
            aria-label="Volver"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="text-center mb-8">
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-2 text-sm font-bold mb-4 shadow-xl">
              <Gift className="w-4 h-4 mr-2 inline" />
              2 MESES GRATIS
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
              Elige tu plan
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Sin permanencia · Cancela cuando quieras · Pago seguro
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
              const roundedPrice = Math.round(plan.precio);
              const monthlyEquivalent = plan.plan_id === "plan_quarterly" ? Math.round(plan.precio / 3) : 
                                       plan.plan_id === "plan_annual" ? Math.round(plan.precio / 12) : null;
              
              return (
                <Card 
                  key={plan.plan_id}
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 bg-white ${
                    isPopular ? "shadow-2xl ring-4 ring-emerald-400 ring-opacity-50 scale-105" : "shadow-xl"
                  }`}
                >
                  {badge && (
                    <div className="absolute top-0 left-0 right-0">
                      <div className={`${badge.color} text-white text-center py-3 text-sm font-bold uppercase tracking-wider`}>
                        {badge.text}
                      </div>
                    </div>
                  )}

                  <CardContent className={`p-6 ${badge ? 'pt-14' : 'pt-6'}`}>
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-3xl flex items-center justify-center shadow-lg ${
                        plan.plan_id === "plan_monthly_trial" ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" :
                        plan.plan_id === "plan_quarterly" ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white" :
                        "bg-gradient-to-br from-orange-500 to-amber-600 text-white"
                      }`}>
                        {getPlanIcon(plan.plan_id)}
                      </div>
                      
                      <h3 className="text-2xl font-extrabold text-gray-900 mb-3">
                        {plan.nombre}
                      </h3>
                      
                      <div className="mb-3">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-6xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">0</span>
                          <span className="text-2xl font-bold text-emerald-600">€</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 font-bold">
                          durante 2 meses
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-400 mb-1">Después solo:</p>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-3xl font-bold text-gray-900">{roundedPrice}</span>
                            <span className="text-lg font-semibold text-gray-600">€</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">
                            {plan.plan_id === "plan_monthly_trial" ? "al mes" : 
                             plan.plan_id === "plan_quarterly" ? "cada 3 meses" : 
                             "al año"}
                          </p>
                        </div>
                      </div>

                      {monthlyEquivalent && (
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-2 rounded-lg border border-emerald-200">
                          <p className="text-xs font-bold text-emerald-700">
                            {monthlyEquivalent}€/mes · {plan.plan_id === "plan_quarterly" ? "Ahorra 10%" : "Ahorra 20%"}
                          </p>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {getPlanFeatures().map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full h-12 text-base font-bold transition-all shadow-lg hover:shadow-xl ${
                        isPopular 
                          ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white" 
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
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
                        "Empezar ahora →"
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-400 mt-2">
                      ✨ Empieza GRATIS 2 meses · Pago seguro vía Stripe
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                ¿Por qué necesito añadir una tarjeta?
              </h2>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-3">
                <p className="text-base font-bold text-green-800">
                  ✅ NO se cobra NADA durante los 60 días de prueba
                </p>
              </div>
              <p className="text-sm text-gray-600">
                La tarjeta solo se usará después de 2 meses si decides continuar. Cancela cuando quieras.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Preguntas frecuentes</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-600 pl-4 py-1">
                <h3 className="text-base font-bold mb-2 text-gray-900">¿Qué pasa después de los 2 meses gratis?</h3>
                <p className="text-sm text-gray-600">
                  Se cobrará automáticamente si no cancelas. Sin cobro durante los 60 días de prueba.
                </p>
              </div>

              <div className="border-l-4 border-emerald-600 pl-4 py-1">
                <h3 className="text-base font-bold mb-2 text-gray-900">¿Cuánto ahorro con los planes largos?</h3>
                <p className="text-sm text-gray-600">
                  <strong>Trimestral:</strong> 30€/mes (10% menos) · <strong>Anual:</strong> 26€/mes (20% menos)
                </p>
              </div>

              <div className="border-l-4 border-orange-600 pl-4 py-1">
                <h3 className="text-base font-bold mb-2 text-gray-900">¿Puedo cancelar en cualquier momento?</h3>
                <p className="text-sm text-gray-600">
                  Sí, sin compromiso. Sin cobro si cancelas en periodo de prueba.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}