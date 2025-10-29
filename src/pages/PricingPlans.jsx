
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, TrendingUp, Crown, Loader2, Gift, Star, ArrowLeft, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function PricingPlansPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [processingPendingPlan, setProcessingPendingPlan] = useState(false); // New state to manage pending plan processing

  const canceled = searchParams.get("canceled");

  // Query for subscription plans, moved up to be available early for useEffects
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
      
      const uniquePlans = Array.from(planMap.values());
      return uniquePlans.sort((a, b) => a.precio - b.precio);
    },
    initialData: [],
  });

  // Initial user load on component mount
  useEffect(() => {
    loadUser();
  }, []);

  // Show toast message if payment was canceled
  useEffect(() => {
    if (canceled) {
      toast.info("Pago cancelado. Puedes volver a elegir un plan cuando quieras.", {
        duration: 5000
      });
    }
  }, [canceled]);

  // ✅ CORREGIDO: Procesar plan pendiente solo cuando todo esté listo
  useEffect(() => {
    // Guard: evitar ejecución múltiple o si ya estamos procesando
    if (processingPendingPlan) return;
    
    // Esperar a que todo esté cargado: user, plans, y que no haya carga activa
    if (isLoadingUser || loadingPlans || !user || plans.length === 0) {
      return;
    }

    const pendingPlan = localStorage.getItem('pending_plan_selection');
    if (pendingPlan) {
      setProcessingPendingPlan(true); // Indicar que estamos procesando
      
      try {
        const planData = JSON.parse(pendingPlan);
        console.log('🔄 Plan pendiente detectado tras login/carga:', planData);
        
        // Limpiar inmediatamente para evitar loops si algo falla más adelante
        localStorage.removeItem('pending_plan_selection');
        
        // Buscar el plan completo en la lista de planes cargados
        const fullPlan = plans.find(p => p.plan_id === planData.plan_id);
        
        if (fullPlan) {
          console.log('✅ Plan completo encontrado:', fullPlan.plan_id);
          
          // Verificar/actualizar user_type a "professionnel" si no lo es ya
          if (user.user_type !== "professionnel") {
            console.log('⚙️ Actualizando user_type a professionnel para plan pendiente...');
            base44.auth.updateMe({ user_type: "professionnel" })
              .then(async () => {
                console.log('✅ User actualizado a professionnel. Recargando usuario...');
                // Recargar el usuario para que el estado `user` se actualice con el nuevo `user_type`
                await loadUser(); 
                // Dar un pequeño tiempo para que React procese la actualización del estado y luego procesar el plan
                setTimeout(() => {
                  handleSelectPlan(fullPlan);
                }, 500); // Pequeño delay
              })
              .catch(error => {
                console.error('❌ Error actualizando user_type para plan pendiente:', error);
                toast.error('Hubo un error al configurar tu cuenta. Inténtalo de nuevo.');
                setProcessingPendingPlan(false); // Finalizar procesamiento en caso de error
              });
          } else {
            // Ya es profesional, procesar el plan directamente
            console.log('✅ Usuario ya es professionnel, continuando con plan pendiente...');
            setTimeout(() => {
              handleSelectPlan(fullPlan);
            }, 500); // Pequeño delay
          }
        } else {
          console.error('❌ Plan no encontrado para continuar:', planData.plan_id);
          toast.error('El plan seleccionado no está disponible actualmente.');
          setProcessingPendingPlan(false); // Finalizar procesamiento en caso de plan no encontrado
        }
      } catch (error) {
        console.error('❌ Error procesando plan pendiente:', error);
        localStorage.removeItem('pending_plan_selection'); // Asegurar limpieza
        setProcessingPendingPlan(false); // Finalizar procesamiento en caso de error
      }
    }
  }, [user, isLoadingUser, plans, loadingPlans, processingPendingPlan]); // Dependencias actualizadas

  const loadUser = async () => {
    setIsLoadingUser(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      console.log('👤 Usuario cargado:', currentUser?.email, 'Tipo:', currentUser?.user_type);
      return currentUser;
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
      return null;
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleSelectPlan = async (plan) => {
    console.log('🎯 handleSelectPlan llamado para:', plan.plan_id);
    console.log('👤 Usuario en handleSelectPlan:', user?.email, 'Tipo:', user?.user_type);
    
    // Si no hay usuario, guardar plan y redirigir a login
    if (!user) {
      console.log('🔑 Sin usuario, guardando plan y redirigiendo a login...');
      
      localStorage.setItem('pending_plan_selection', JSON.stringify({
        plan_id: plan.plan_id,
        precio: plan.precio,
        timestamp: Date.now()
      }));
      
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    // Verificar que sea profesional, si no, actualizar y luego continuar
    // Esta lógica podría haberse ejecutado ya por el useEffect de pending_plan_selection,
    // pero se mantiene aquí como un fallback robusto por si handleSelectPlan se llama directamente
    if (user.user_type !== "professionnel") {
      console.log('⚙️ Usuario no es profesional, intentando actualizar...');
      try {
        await base44.auth.updateMe({ user_type: "professionnel" });
        console.log('✅ Usuario actualizado a professionnel');
        // Recargar usuario para que el estado se actualice
        const updatedUser = await loadUser();
        setUser(updatedUser); 
      } catch (error) {
        console.error('❌ Error actualizando user_type en handleSelectPlan:', error);
        toast.error('Error al configurar tu cuenta. Por favor, inténtalo de nuevo.');
        setIsProcessing(false);
        setSelectedPlan(null);
        setProcessingPendingPlan(false); // Asegurar que el flag se resetee
        return; 
      }
    }

    setSelectedPlan(plan.plan_id);
    setIsProcessing(true);
    setError(null);

    try {
      const loadingToast = toast.loading(
        plan.plan_id === "plan_monthly_trial" 
          ? "Configurando tu prueba gratuita..."
          : "Procesando pago..."
      );

      console.log('💳 Llamando a createCheckoutSession...');
      // En este punto, `user` debe ser "professionnel" y estar cargado
      const response = await base44.functions.invoke('createCheckoutSession', {
        email: user.email, 
        fullName: user.full_name || user.email,
        userType: "professionnel",  
        cifNif: "", 
        phone: user.phone || "",
        activity: "Sin especificar", 
        activityOther: "",
        address: user.city || "Sin especificar", 
        paymentMethod: "stripe",
        planId: plan.plan_id,
        planPrice: plan.precio,
        isTrial: plan.plan_id === "plan_monthly_trial"
      });

      toast.dismiss(loadingToast);

      console.log('📥 Respuesta de createCheckoutSession:', response.data);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      if (response.data.url) {
        console.log('✅ Redirigiendo a Stripe checkout:', response.data.url);
        window.location.href = response.data.url;
      } else {
        throw new Error('No se pudo crear la sesión de pago');
      }
    } catch (err) {
      console.error("❌ Error selecting plan:", err);
      const errorMessage = "Ha habido un problema al procesar tu solicitud. Por favor, inténtalo de nuevo.";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
      setSelectedPlan(null);
      setProcessingPendingPlan(false); // Asegurar que el flag se resetee en caso de error
    }
  };

  // Intelligent back navigation logic
  const handleGoBack = () => {
    if (!user) {
      // Without user → go to home/search page
      navigate(createPageUrl("Search"));
    } else if (user.user_type === "professionnel") {
      // Professional → check if they have an active subscription
      if (user.subscription_status && user.subscription_status !== "inactivo") {
        // Has active subscription → go to their profile
        navigate(createPageUrl("MyProfile"));
      } else {
        // No active subscription → go to home/search page
        navigate(createPageUrl("Search"));
      }
    } else {
      // Client → go to home/search page
      navigate(createPageUrl("Search"));
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case "plan_monthly_trial": return <Gift className="w-8 h-8 text-blue-600" />;
      case "plan_quarterly": return <TrendingUp className="w-8 h-8 text-green-600" />;
      case "plan_annual": return <Crown className="w-8 h-8 text-orange-600" />;
      default: return <CheckCircle className="w-8 h-8 text-gray-600" />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case "plan_monthly_trial": return "from-blue-500 to-blue-700";
      case "plan_quarterly": return "from-green-500 to-green-700";
      case "plan_annual": return "from-orange-500 to-orange-700";
      default: return "from-gray-500 to-gray-700";
    }
  };

  const getPlanFeatures = (planId) => {
    const commonFeatures = [
      "Aparece en búsquedas",
      "Perfil profesional completo",
      "Chat directo con clientes",
      "Recibe valoraciones",
      "Galería de fotos ilimitada",
      "Renovación automática"
    ];

    switch (planId) {
      case "plan_monthly_trial":
        return [
          ...commonFeatures.slice(0, 5),
          "Soporte estándar"
        ];
      case "plan_quarterly":
        return [
          ...commonFeatures.slice(0, 5),
          "⭐ Perfil destacado 2 semanas",
          "Ahorro de 27€",
          "Renovación automática"
        ];
      case "plan_annual":
        return [
          ...commonFeatures.slice(0, 5),
          "⭐ Perfil destacado 1 mes completo",
          "Ahorro de 138€",
          "Soporte prioritario",
          "Renovación automática"
        ];
      default:
        return commonFeatures;
    }
  };

  // ✅ Mostrar loading mientras se procesa plan pendiente
  if (isLoadingUser || loadingPlans || processingPendingPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        {processingPendingPlan && (
          <p className="text-gray-600">Continuando con tu selección...</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="mb-6 hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Elige tu Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Selecciona el plan que mejor se adapte a tus necesidades y empieza a recibir clientes
          </p>
          
          {!user && (
            <p className="text-sm text-blue-600 mt-4">
              Al seleccionar un plan, se te pedirá que inicies sesión o crees una cuenta
            </p>
          )}
          
          {canceled && (
            <Alert className="mt-6 max-w-2xl mx-auto bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Pago cancelado.</strong> No te preocupes, puedes volver a elegir un plan cuando quieras. 
                Tu información se guardará y podrás continuar donde lo dejaste.
              </AlertDescription>
            </Alert>
          )}

          {user?.user_type === "client" && (
            <Alert className="mt-6 max-w-2xl mx-auto bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-900">
                <strong>ℹ️ Información:</strong> Estos planes son para autónomos que quieren ofrecer sus servicios. 
                Como cliente, puedes buscar y contactar profesionales de forma totalmente gratuita.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 max-w-3xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.plan_id}
              className={`relative overflow-hidden border-0 shadow-2xl transition-all duration-300 hover:scale-105 bg-white ${
                plan.plan_id === "plan_quarterly" ? "ring-4 ring-green-500" : ""
              }`}
            >
              {plan.plan_id === "plan_quarterly" && (
                <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                  Más Popular
                </Badge>
              )}

              {plan.plan_id === "plan_monthly_trial" && (
                <Badge className="absolute top-4 right-4 bg-blue-500 text-white">
                  7 Días Gratis
                </Badge>
              )}

              {plan.ahorro > 0 && plan.plan_id !== "plan_monthly_trial" && (
                <Badge className="absolute top-4 right-4 bg-orange-500 text-white">
                  Ahorra {plan.ahorro}€
                </Badge>
              )}

              <CardHeader className={`bg-gradient-to-r ${getPlanColor(plan.plan_id)} text-white p-8`}>
                <div className="flex items-center justify-center mb-4">
                  {getPlanIcon(plan.plan_id)}
                </div>
                <CardTitle className="text-center text-2xl font-bold">
                  {plan.plan_id === "plan_monthly_trial" ? "Mensual — 7 días gratis" : plan.nombre}
                </CardTitle>
                <div className="text-center mt-4">
                  <p className="text-5xl font-bold">
                    {plan.plan_id === "plan_monthly_trial" ? (
                      <>
                        <span className="text-2xl opacity-90">Luego {plan.precio}€/mes</span>
                      </>
                    ) : (
                      `${plan.precio}€`
                    )}
                  </p>
                  {plan.plan_id !== "plan_monthly_trial" && (
                    <p className="text-sm opacity-90 mt-2">
                      {plan.duracion_dias === 30 ? "/mes" : 
                       plan.duracion_dias === 90 ? "/3 meses" : 
                       "/año"}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-8 bg-white">
                <p className="text-gray-600 mb-6 min-h-[60px] text-sm leading-relaxed">
                  {plan.plan_id === "plan_monthly_trial" 
                    ? "Prueba 7 días gratis. Luego 49€/mes. Cancela cuando quieras."
                    : plan.descripcion}
                </p>

                <ul className="space-y-3 mb-8">
                  {getPlanFeatures(plan.plan_id).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {feature.includes("⭐") ? (
                        <>
                          <Star className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0 fill-amber-500" />
                          <span className="text-gray-900 font-semibold">{feature.replace("⭐ ", "")}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </>
                      )}
                    </li>
                  ))}
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
                    plan.plan_id === "plan_monthly_trial" ? "Comenzar Prueba Gratis" : "Seleccionar Plan"
                  )}
                </Button>

                {plan.plan_id === "plan_monthly_trial" && (
                  <p className="text-xs text-green-700 text-center mt-3 bg-green-50 p-2 rounded">
                    ✓ Requiere tarjeta. Sin cobro hasta que acabe la prueba.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Comparación de planes</h2>
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Característica</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Mensual</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Trimestral</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Anual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Precio</td>
                    <td className="px-6 py-4 text-sm text-center">49€/mes</td>
                    <td className="px-6 py-4 text-sm text-center">120€/3 meses</td>
                    <td className="px-6 py-4 text-sm text-center">450€/año</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Prueba gratuita</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center">-</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Duración prueba</td>
                    <td className="px-6 py-4 text-sm text-center font-semibold text-green-700">7 días gratis</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center">-</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Perfil completo</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Chat con clientes</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="bg-amber-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">Perfil destacado</td>
                    <td className="px-6 py-4 text-center text-gray-500">-</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <Star className="w-5 h-5 text-amber-500 mb-1 fill-amber-500" />
                        <span className="text-xs font-semibold text-amber-700">2 semanas</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <Star className="w-5 h-5 text-amber-500 mb-1 fill-amber-500" />
                        <span className="text-xs font-semibold text-amber-700">1 mes completo</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Ahorro vs mensual</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">27€</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">138€</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-700">Soporte prioritario</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Qué significa "perfil destacado"?</h3>
                <p className="text-gray-600">
                  Los perfiles destacados aparecen en las primeras posiciones de las búsquedas, con un badge especial que aumenta tu visibilidad y probabilidad de recibir contactos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Qué pasa después de los 7 días de prueba?</h3>
                <p className="text-gray-600">
                  <strong>⚠️ IMPORTANTE:</strong> Se requiere tarjeta de crédito para activar la prueba. Si no cancelas antes de que terminen los 7 días, se cobrará automáticamente 49€/mes y tu plan se convertirá en el plan mensual. NO se realizará ningún cobro durante los 7 días de prueba.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Por qué necesito añadir una tarjeta para la prueba gratuita?</h3>
                <p className="text-gray-600">
                  La tarjeta es necesaria para poder cobrar automáticamente después del periodo de prueba si decides continuar. <strong>No se te cobrará nada durante los 7 días.</strong> Puedes cancelar en cualquier momento antes de que finalice la prueba.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Cuándo se destaca mi perfil en los planes trimestral y anual?</h3>
                <p className="text-gray-600">
                  <strong>Plan Trimestral:</strong> Tu perfil se destaca las primeras 2 semanas al inicio de cada trimestre.<br/>
                  <strong>Plan Anual:</strong> Tu perfil se destaca durante el primer mes completo del año.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Puedo cancelar en cualquier momento?</h3>
                <p className="text-gray-600">
                  Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario. Si cancelas durante la prueba gratuita de 7 días, no se te cobrará nada. Si cancelas después, seguirás teniendo acceso hasta el final del periodo pagado.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Cuánto ahorro con el plan trimestral o anual?</h3>
                <p className="text-gray-600">
                  Con el plan trimestral ahorras 27€ (120€ vs 147€). Con el plan anual ahorras 138€ (450€ vs 588€).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
