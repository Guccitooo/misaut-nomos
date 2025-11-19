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
import { useLanguage } from "../components/ui/LanguageSwitcher";

export default function PricingPlansPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canceled = searchParams.get("canceled");

  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const allPlans = await base44.entities.SubscriptionPlan.list();
      const planMap = new Map();
      
      allPlans.forEach(plan => {
        if (['plan_monthly_trial', 'plan_quarterly', 'plan_annual'].includes(plan.plan_id)) {
          planMap.set(plan.plan_id, plan);
        }
      });
      
      return Array.from(planMap.values()).sort((a, b) => a.precio - b.precio);
    },
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (canceled) {
      toast.info('Pago cancelado. Puedes volver cuando quieras.', { duration: 5000 });
    }
  }, [canceled]);

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
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setSelectedPlan(plan.plan_id);
    setIsProcessing(true);

    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        planId: plan.plan_id,
        planPrice: plan.precio,
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      toast.error(err.message || 'Error al procesar el pago');
      setIsProcessing(false);
      setSelectedPlan(null);
    }
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
      case "plan_monthly_trial": return { text: '2 meses gratis', color: "bg-blue-500" };
      case "plan_quarterly": return { text: 'Más popular', color: "bg-green-500" };
      case "plan_annual": return { text: 'Mejor valor', color: "bg-orange-500" };
      default: return null;
    }
  };

  return (
    <>
      <SEOHead title="Planes - MisAutónomos" />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate(createPageUrl("Search"))} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="text-center mb-8">
            <Badge className="bg-green-600 text-white px-6 py-2 mb-4">
              <Gift className="w-4 h-4 mr-2 inline" />
              2 MESES GRATIS
            </Badge>
            
            <h1 className="text-4xl font-bold mb-3">Elige tu plan</h1>
            <p className="text-lg text-gray-600">Sin permanencia. Cancela cuando quieras.</p>
          </div>

          {canceled && (
            <Alert className="mb-6 max-w-2xl mx-auto">
              <Info className="h-4 w-4" />
              <AlertDescription>Pago cancelado. Vuelve cuando quieras.</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => {
              const badge = getPlanBadge(plan.plan_id);
              const isPopular = plan.plan_id === "plan_quarterly";
              
              return (
                <Card key={plan.plan_id} className={`${isPopular ? "border-green-500 border-2 shadow-xl" : ""}`}>
                  {badge && (
                    <div className={`${badge.color} text-white text-center py-2 text-sm font-bold`}>
                      {badge.text}
                    </div>
                  )}

                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
                        plan.plan_id === "plan_monthly_trial" ? "bg-blue-100 text-blue-600" :
                        plan.plan_id === "plan_quarterly" ? "bg-green-100 text-green-600" :
                        "bg-orange-100 text-orange-600"
                      }`}>
                        {getPlanIcon(plan.plan_id)}
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-2">{plan.nombre}</h3>
                      <p className="text-4xl font-bold">{plan.precio}€</p>
                      <p className="text-sm text-gray-500">
                        {plan.plan_id === "plan_monthly_trial" && "/mes"}
                        {plan.plan_id === "plan_quarterly" && "/3 meses"}
                        {plan.plan_id === "plan_annual" && "/año"}
                      </p>
                    </div>

                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>Perfil profesional completo</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>Chat directo con clientes</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>Galería de fotos ilimitada</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>Cancela cuando quieras</span>
                      </li>
                    </ul>

                    <Button
                      className={`w-full h-12 ${isPopular ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isProcessing && selectedPlan === plan.plan_id}
                    >
                      {isProcessing && selectedPlan === plan.plan_id ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Empezar ahora'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}