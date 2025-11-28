import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "../components/ui/LanguageSwitcher";

export default function PaymentSuccessPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [countdown, setCountdown] = useState(5);
  const [profileExists, setProfileExists] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      verifyPaymentAndSetup();
    } else {
      // Sin session_id, ir directo a verificar estado
      checkUserStatus();
    }
  }, [sessionId]);

  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      handleContinue();
    }
  }, [status, countdown]);

  const verifyPaymentAndSetup = async () => {
    try {
      // Limpiar cache para forzar datos frescos
      sessionStorage.removeItem('current_user');
      
      // Esperar un momento para que el webhook procese
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Obtener usuario actualizado
      const user = await base44.auth.me();
      
      if (!user) {
        setStatus("error");
        return;
      }

      // Verificar suscripción con reintentos
      let attempts = 0;
      const maxAttempts = 12;
      let subscriptionFound = false;
      let lastSub = null;

      while (attempts < maxAttempts && !subscriptionFound) {
        const subs = await base44.entities.Subscription.filter({ user_id: user.id });
        
        if (subs.length > 0) {
          lastSub = subs[0];
          const estado = lastSub.estado?.toLowerCase();
          
          if (estado === 'activo' || estado === 'en_prueba' || estado === 'trialing' || estado === 'active' || estado === 'trial_active') {
            subscriptionFound = true;
            console.log('✅ Suscripción encontrada:', estado);
            break;
          }
        }
        
        attempts++;
        console.log(`🔄 Intento ${attempts}/${maxAttempts} - Esperando webhook...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      if (!subscriptionFound) {
        // Intentar una última vez después de más espera
        await new Promise(resolve => setTimeout(resolve, 3000));
        const finalSubs = await base44.entities.Subscription.filter({ user_id: user.id });
        if (finalSubs.length > 0) {
          subscriptionFound = true;
          lastSub = finalSubs[0];
        }
      }

      // Verificar perfil
      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
      const hasProfile = profiles.length > 0;
      const isOnboardingDone = hasProfile && profiles[0].onboarding_completed === true;
      
      setProfileExists(hasProfile);
      setOnboardingCompleted(isOnboardingDone);

      // Forzar actualización del user_type si no está correcto
      if (user.user_type !== 'professionnel') {
        await base44.auth.updateMe({ user_type: 'professionnel' });
        console.log('✅ user_type actualizado a professionnel');
      }

      // Si tiene suscripción Y onboarding completo, asegurar que perfil sea visible
      if (subscriptionFound && isOnboardingDone && hasProfile) {
        const profile = profiles[0];
        if (!profile.visible_en_busqueda) {
          await base44.entities.ProfessionalProfile.update(profile.id, {
            visible_en_busqueda: true,
            estado_perfil: 'activo'
          });
          console.log('✅ Perfil actualizado a visible');
        }
      }

      // Limpiar cache de nuevo para tener datos frescos
      sessionStorage.removeItem('current_user');

      setStatus("success");

    } catch (error) {
      console.error("Error verificando pago:", error);
      setStatus("error");
    }
  };

  const checkUserStatus = async () => {
    try {
      sessionStorage.removeItem('current_user');
      const user = await base44.auth.me();
      
      if (!user) {
        navigate(createPageUrl("PricingPlans"));
        return;
      }

      const profiles = await base44.entities.ProfessionalProfile.filter({ user_id: user.id });
      setProfileExists(profiles.length > 0);
      setOnboardingCompleted(profiles.length > 0 && profiles[0].onboarding_completed === true);
      
      setStatus("success");
    } catch (error) {
      setStatus("error");
    }
  };

  const handleContinue = () => {
    sessionStorage.removeItem('current_user');
    
    if (onboardingCompleted) {
      // Perfil completo -> ir al dashboard
      navigate(createPageUrl("ProfessionalDashboard"));
    } else {
      // Necesita completar onboarding
      navigate(createPageUrl("ProfileOnboarding"));
    }
  };

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Verificando tu pago...
            </h1>
            <p className="text-gray-600">
              Estamos confirmando tu suscripción y preparando tu cuenta profesional.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Esto solo tardará unos segundos...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Hubo un problema
            </h1>
            <p className="text-gray-600 mb-6">
              No pudimos verificar tu pago. Si acabas de pagar, espera unos minutos y recarga la página.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Reintentar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(createPageUrl("PricingPlans"))}
                className="w-full"
              >
                Volver a planes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            ¡Pago confirmado!
          </h1>
          <p className="text-green-100 text-lg">
            Tu suscripción está activa
          </p>
        </div>

        <CardContent className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
              <Sparkles className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Ya eres profesional</p>
                <p className="text-sm text-green-700">Tu cuenta tiene acceso a todas las funcionalidades</p>
              </div>
            </div>

            {!onboardingCompleted && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <ArrowRight className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">Siguiente paso</p>
                  <p className="text-sm text-blue-700">Completa tu perfil para aparecer en búsquedas</p>
                </div>
              </div>
            )}

            {onboardingCompleted && (
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <CheckCircle className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-900">¡Perfil visible!</p>
                  <p className="text-sm text-purple-700">Los clientes ya pueden encontrarte</p>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleContinue}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            {onboardingCompleted ? "Ir a mi dashboard" : "Completar mi perfil"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Redirigiendo automáticamente en {countdown} segundos...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}