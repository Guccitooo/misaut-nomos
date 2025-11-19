import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  TrendingUp,
  Zap,
  AlertCircle,
  Briefcase,
  Calendar,
  Euro,
  Gift
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "../components/seo/SEOHead";

const isSubscriptionActive = (estado, fechaExpiracion) => {
  if (!estado) return false;
  
  const normalizedState = estado.toLowerCase().trim();
  const validStates = ["activo", "active", "en_prueba", "trialing", "trial_active"];
  
  if (validStates.includes(normalizedState)) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiration = new Date(fechaExpiracion);
      expiration.setHours(0, 0, 0, 0);
      
      return expiration >= today;
    } catch (error) {
      return true;
    }
  }
  
  if (normalizedState === "cancelado" || normalizedState === "canceled") {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiration = new Date(fechaExpiracion);
      expiration.setHours(0, 0, 0, 0);
      
      return expiration >= today;
    } catch (error) {
      return false;
    }
  }
  
  return false;
};

export default function SubscriptionManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  // Redirect to onboarding if professional_pending
  useEffect(() => {
    if (user && user.user_type === 'professional_pending') {
      console.log('⚠️ Usuario professional_pending en SubscriptionManagement - redirigiendo a onboarding');
      navigate(createPageUrl("ProfileOnboarding"), { replace: true });
    }
  }, [user, navigate]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({
        user_id: user.id
      });
      
      return subs[0];
    },
    enabled: !!user,
    retry: 1,
  });

  const { data: plan } = useQuery({
    queryKey: ['plan', subscription?.plan_id],
    queryFn: async () => {
      const plans = await base44.entities.SubscriptionPlan.filter({
        plan_id: subscription.plan_id
      });
      return plans[0];
    },
    enabled: !!subscription,
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cancelSubscription', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success(data.message || "Suscripción cancelada correctamente");
      setShowCancelDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Error al cancelar la suscripción");
    }
  });

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    await cancelSubscriptionMutation.mutateAsync();
    setIsCancelling(false);
  };

  const getStatusBadge = (estado) => {
    const normalizedState = estado?.toLowerCase();
    
    switch (normalizedState) {
      case "activo":
      case "active":
        return <Badge className="bg-green-100 text-green-800 border border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>;
      case "cancelado":
      case "canceled":
        return <Badge className="bg-amber-100 text-amber-800 border border-amber-300"><AlertTriangle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      case "finalizada":
      case "finished":
        return <Badge className="bg-red-100 text-red-800 border border-red-300"><XCircle className="w-3 h-3 mr-1" />Finalizado</Badge>;
      case "en_prueba":
      case "trialing":
      case "trial_active":
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-300"><Gift className="w-3 h-3 mr-1" />Periodo gratuito</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getDaysLeft = (expirationDateString) => {
    if (!expirationDateString) return 0;
    const today = new Date();
    const expiration = new Date(expirationDateString);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isInTrial = () => {
    if (!subscription) return false;
    const normalizedState = subscription.estado?.toLowerCase();
    return normalizedState === "en_prueba" || normalizedState === "trialing" || normalizedState === "trial_active";
  };

  const isActive = () => {
    if (!subscription) return false;
    return isSubscriptionActive(subscription.estado, subscription.fecha_expiracion);
  };

  if (!user || loadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <>
        <SEOHead 
          title="Mi Suscripción - MisAutónomos"
          description="Gestiona tu plan profesional"
          noindex={true}
        />
        
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg border-0">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Sin suscripción activa
                </h2>
                
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Necesitas contratar un plan profesional para que tu perfil aparezca en las búsquedas.
                </p>

                <Button
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Ver planes disponibles
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const daysLeft = getDaysLeft(subscription.fecha_expiracion);
  const inTrial = isInTrial();
  const subscriptionActive = isActive();

  return (
    <>
      <SEOHead 
        title="Mi Suscripción - MisAutónomos"
        description="Gestiona tu plan profesional"
        noindex={true}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Suscripción</h1>
              <p className="text-gray-600">Gestiona tu plan profesional</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("MyProfile"))}
              aria-label="Volver a Mi Perfil"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al perfil
            </Button>
          </div>

          <Card className="mb-6 shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-700" />
                Información de tu plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Plan actual</p>
                  <p className="text-2xl font-bold text-gray-900">{plan?.nombre || subscription.plan_nombre}</p>
                  <p className="text-sm text-gray-600 mt-1">{plan?.precio || subscription.plan_precio}€ / {
                    plan?.duracion_dias === 30 ? "mes" :
                    plan?.duracion_dias === 90 ? "3 meses" :
                    "año"
                  }</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(subscription.estado)}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de inicio</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(subscription.fecha_inicio).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {inTrial ? "Fin del periodo gratuito" : "Próxima renovación"}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    {daysLeft > 0 && (
                      <p className="text-sm text-blue-600 mt-0.5">
                        {daysLeft} {daysLeft === 1 ? 'día' : 'días'} restantes
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {inTrial && subscriptionActive && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Gift className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-900 mb-2">
                        🎁 Periodo de prueba gratuito activo
                      </p>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        Tu perfil está visible para clientes. NO se te cobrará nada durante los 60 días. 
                        Tienes <strong>{daysLeft} días restantes</strong> de prueba gratuita. 
                        Si no cancelas antes del {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}, 
                        se cobrará automáticamente {plan?.precio || subscription.plan_precio}€.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {subscription.estado === "activo" && !inTrial && subscriptionActive && (
                <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-green-900 mb-1">
                        ✅ Suscripción activa y vigente
                      </p>
                      <p className="text-sm text-green-800">
                        Tu perfil es visible para todos los clientes. Todo está en orden.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {subscription.estado === "cancelado" && subscriptionActive && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-900 mb-2">
                        ⚠️ Suscripción cancelada
                      </p>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Tu plan está activo hasta el <strong>{new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}</strong>.
                        Tu perfil seguirá visible durante <strong>{daysLeft} días más</strong>.
                        Después dejará de aparecer en las búsquedas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!subscriptionActive && (
                <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-900 mb-2">
                        ❌ Suscripción finalizada
                      </p>
                      <p className="text-sm text-red-800">
                        Tu perfil ya no es visible en las búsquedas. Reactiva tu plan para volver a aparecer.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {inTrial && (
              <Card className="shadow-md border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-10 h-10 text-purple-700 mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Mejora tu plan
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Ahorra hasta 138€/año con plan trimestral o anual
                  </p>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate(createPageUrl("PricingPlans"))}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Ver planes superiores
                  </Button>
                </CardContent>
              </Card>
            )}

            {!subscriptionActive && (
              <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6 text-center">
                  <Briefcase className="w-10 h-10 text-blue-700 mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Reactiva tu plan
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Vuelve a aparecer en las búsquedas
                  </p>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate(createPageUrl("PricingPlans"))}
                  >
                    Ver planes disponibles
                  </Button>
                </CardContent>
              </Card>
            )}

            {subscriptionActive && (
              <Card className="shadow-md border-0">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    Cancelar suscripción
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {inTrial 
                      ? "Si cancelas durante la prueba, no se te cobrará nada. Tu perfil seguirá visible hasta el final del periodo gratuito."
                      : "Tu perfil seguirá visible hasta la fecha de expiración de tu plan actual. Después dejará de aparecer en búsquedas."}
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar renovación
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-md border-0">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Cambiar plan
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Explora otros planes que se adapten mejor a tus necesidades
                </p>
                <Button
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                >
                  Ver todos los planes
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">💡 Información importante</h3>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• Puedes cancelar tu suscripción en cualquier momento</li>
                    <li>• Si cancelas durante el periodo gratuito, no se te cobrará nada</li>
                    <li>• Al cancelar, tu perfil dejará de aparecer en búsquedas inmediatamente</li>
                    <li>• Puedes reactivar tu plan cuando quieras desde esta página</li>
                    {inTrial && (
                      <li className="text-blue-700 font-semibold">
                        • El primer cobro se realizará el {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              ¿Cancelar suscripción?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
            <p className="text-gray-700">
            Si cancelas tu suscripción:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            {inTrial ? (
              <>
                <li><strong>NO se te cobrará nada</strong> (seguirás usando tus días gratuitos)</li>
                <li>Tu perfil <strong>seguirá visible hasta el final de tu periodo de prueba</strong> ({new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')})</li>
                <li>Al finalizar el periodo gratuito, tu perfil dejará de aparecer automáticamente</li>
                <li>Puedes reactivar tu suscripción cuando quieras</li>
              </>
            ) : (
              <>
                <li>Tu perfil seguirá visible hasta el <strong>{new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}</strong></li>
                <li>Después de esa fecha, tu perfil dejará de aparecer en las búsquedas</li>
                <li>No se renovará automáticamente</li>
                <li>Podrás reactivar tu suscripción en cualquier momento</li>
              </>
            )}
            </ul>
            <p className="text-gray-900 font-semibold pt-2">
            ¿Estás seguro que deseas continuar?
            </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
            >
              No, mantener activo
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Sí, cancelar suscripción
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}