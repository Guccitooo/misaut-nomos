import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, TrendingUp, Crown, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PricingPlansPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
    initialData: [],
  });

  const handleSelectPlan = async (plan) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    setSelectedPlan(plan.plan_id);
    setIsProcessing(true);
    setError(null);

    try {
      if (plan.plan_id === "plan_trial") {
        // Create trial subscription directly
        await base44.functions.invoke('onUserCreated', {
          userId: user.id,
          selectedPlan: plan.plan_id,
          userData: {
            fullName: user.full_name,
            city: user.city,
            activity: "Sin especificar"
          }
        });

        navigate(createPageUrl("MyProfile"));
      } else {
        // Redirect to Stripe for paid plans
        const response = await base44.functions.invoke('createCheckoutSession', {
          email: user.email,
          fullName: user.full_name || user.email,
          userType: user.user_type || "autonomo",
          cifNif: "",
          phone: user.phone || "",
          activity: "Sin especificar",
          activityOther: "",
          address: user.city || "Sin especificar",
          paymentMethod: "stripe",
          planId: plan.plan_id,
          planPrice: plan.precio
        });

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        if (response.data.url) {
          window.location.href = response.data.url;
        }
      }
    } catch (err) {
      console.error("Error selecting plan:", err);
      setError("Ha habido un problema al procesar tu solicitud. Por favor, inténtalo de nuevo.");
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case "plan_trial": return <Zap className="w-8 h-8 text-blue-600" />;
      case "plan_monthly": return <TrendingUp className="w-8 h-8 text-green-600" />;
      case "plan_quarterly": return <Crown className="w-8 h-8 text-orange-600" />;
      default: return <CheckCircle className="w-8 h-8 text-gray-600" />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case "plan_trial": return "from-blue-500 to-blue-700";
      case "plan_monthly": return "from-green-500 to-green-700";
      case "plan_quarterly": return "from-orange-500 to-orange-700";
      default: return "from-gray-500 to-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Elige tu Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Selecciona el plan que mejor se adapte a tus necesidades y empieza a recibir clientes
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 max-w-3xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.plan_id}
              className={`relative overflow-hidden border-0 shadow-2xl transition-all duration-300 hover:scale-105 ${
                plan.plan_id === "plan_monthly" ? "ring-4 ring-green-500" : ""
              }`}
            >
              {plan.plan_id === "plan_monthly" && (
                <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                  Más Popular
                </Badge>
              )}

              {plan.ahorro > 0 && (
                <Badge className="absolute top-4 right-4 bg-orange-500 text-white">
                  Ahorra {plan.ahorro}€
                </Badge>
              )}

              <CardHeader className={`bg-gradient-to-r ${getPlanColor(plan.plan_id)} text-white p-8`}>
                <div className="flex items-center justify-center mb-4">
                  {getPlanIcon(plan.plan_id)}
                </div>
                <CardTitle className="text-center text-2xl font-bold">
                  {plan.nombre}
                </CardTitle>
                <div className="text-center mt-4">
                  <p className="text-5xl font-bold">
                    {plan.precio === 0 ? "Gratis" : `${plan.precio}€`}
                  </p>
                  <p className="text-sm opacity-90 mt-2">
                    {plan.duracion_dias === 7 ? "7 días" : 
                     plan.duracion_dias === 30 ? "/mes" : 
                     "/3 meses"}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <p className="text-gray-600 mb-6 min-h-[80px]">
                  {plan.descripcion}
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Aparece en búsquedas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Perfil profesional completo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Mensajes ilimitados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Recibe valoraciones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Galería de fotos</span>
                  </li>
                  {plan.renovacion_automatica && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Renovación automática</span>
                    </li>
                  )}
                </ul>

                <Button
                  className={`w-full h-12 text-lg font-semibold bg-gradient-to-r ${getPlanColor(plan.plan_id)}`}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isProcessing && selectedPlan === plan.plan_id}
                >
                  {isProcessing && selectedPlan === plan.plan_id ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    plan.precio === 0 ? "Comenzar Gratis" : "Seleccionar Plan"
                  )}
                </Button>

                {plan.plan_id === "plan_trial" && (
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Sin tarjeta de crédito requerida
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Qué pasa después de los 7 días de prueba?</h3>
                <p className="text-gray-600">
                  Al finalizar tu prueba gratuita, si no cancelas, tu plan se convertirá automáticamente en el plan mensual de 49€/mes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Puedo cancelar en cualquier momento?</h3>
                <p className="text-gray-600">
                  Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario. No hay permanencia.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Cuánto ahorro con el plan trimestral?</h3>
                <p className="text-gray-600">
                  Con el plan trimestral ahorras 27€ en comparación con pagar 3 meses del plan mensual (147€ vs 120€).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}