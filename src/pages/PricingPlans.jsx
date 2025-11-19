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
      toast.info(t('paymentCanceled') + ". " + t('comeBackAnytime'), {
        duration: 5000
      });
    }
  }, [canceled, t]);

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
    toast.error(err.message || t('paymentError'));
    setIsProcessing(false);
    setSelectedPlan(null);
    }
    };

  const handleGoBack = () => {
    navigate(createPageUrl("Search"));
  };
  
  const getLocalizedInterval = (planId) => {
    if (planId === "plan_monthly_trial") return `/${t('month')}`;
    if (planId === "plan_quarterly") return `/${t('threeMonths')}`;
    return `/${t('year')}`;
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
        return { text: t('twoMonthsFree'), color: "bg-blue-500" };
      case "plan_quarterly": 
        return { text: t('mostPopular'), color: "bg-green-500" };
      case "plan_annual": 
        return { text: t('bestValue'), color: "bg-orange-500" };
      default: 
        return null;
    }
  };

  const getPlanFeatures = () => [
    t('featureSearches'),
    t('featureFullProfile'),
    t('featureDirectChat'),
    t('featureReviews'),
    t('featurePhotoGallery'),
    t('featureSupport'),
    t('featureCancelAnytime')
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
        <div className="max-w-6xl mx-auto px-3 lg:px-4 py-4 lg:py-8">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-6 hover:bg-blue-50"
            aria-label={t('back')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Button>

          <div className="text-center mb-8">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 text-base font-bold mb-4">
              <Gift className="w-4 h-4 mr-2 inline" />
              {t('twoMonthsFreeAllPlans')}
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              {t('chooseYourPlan')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
              {t('startFree2Months')}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">{t('cancelAnytime')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">{t('noHiddenCosts')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">{t('secure100')}</span>
              </div>
            </div>
          </div>

          {canceled && (
            <Alert className="mb-6 max-w-2xl mx-auto bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                {t('paymentCanceledComeBack')}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
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
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
                        plan.plan_id === "plan_monthly_trial" ? "bg-blue-100 text-blue-600" :
                        plan.plan_id === "plan_quarterly" ? "bg-green-100 text-green-600" :
                        "bg-orange-100 text-orange-600"
                      }`}>
                        {getPlanIcon(plan.plan_id)}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.nombre}
                      </h3>
                      
                      <div className="mb-2">
                        <p className="text-4xl font-bold text-gray-900">
                          {plan.precio}€
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {getLocalizedInterval(plan.plan_id)}
                        </p>
                      </div>

                      {plan.plan_id !== "plan_monthly_trial" && (
                        <p className="text-sm text-green-600 font-semibold">
                          {plan.plan_id === "plan_quarterly" && t('quarterlyDiscount')}
                          {plan.plan_id === "plan_annual" && t('annualDiscount')}
                        </p>
                      )}

                      <div className="mt-3 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-bold text-green-700">
                          ✨ {t('startFree2Months')}
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-2.5 mb-6">
                      {getPlanFeatures().map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
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
                      aria-label={`${t('selectPlan')} ${plan.nombre}`}
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
                      {t('secureCheckoutStripe')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 mb-8">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                💳 {t('whyNeedCard')}
              </h2>
              <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">
                {t('cardNeededForAuto')}
                <span className="block mt-2 text-green-700 font-bold">
                  ✅ {t('noChargeFirst60Days')}
                </span>
                <span className="block mt-1 text-gray-600">
                  {t('cancelAnytimeBeforeTrial')}
                </span>
              </p>
            </CardContent>
          </Card>

          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">{t('faq')}</h2>
            <div className="space-y-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">{t('faqAfter2Months')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('faqAfter2MonthsAnswer')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">{t('faqHowMuchSave')}</h3>
                  <p className="text-sm text-gray-600">
                    <strong>{t('quarterly')}:</strong> {t('faqQuarterlySavings')}<br/>
                    <strong>{t('annual')}:</strong> {t('faqAnnualSavings')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">{t('faqCanCancelAnytime')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('faqCanCancelAnswer')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">{t('faqTrialMultipleTimes')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('faqTrialOnceAnswer')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}