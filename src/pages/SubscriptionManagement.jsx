import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Info,
  TrendingUp,
  Zap
} from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      console.log('👤 Usuario cargado:', {
        email: currentUser.email,
        subscription_status: currentUser.subscription_status,
        user_type: currentUser.user_type
      });
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
      base44.auth.redirectToLogin();
    }
  };

  const { data: subscription, isLoading: loadingSubscription, error: subscriptionError } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      console.log('🔍 Buscando suscripción para user_id:', user.id);
      
      const subs = await base44.entities.Subscription.filter({
        user_id: user.id
      });
      
      console.log('📦 Suscripciones encontradas:', subs.length);
      if (subs[0]) {
        console.log('✅ Suscripción:', {
          estado: subs[0].estado,
          plan_nombre: subs[0].plan_nombre,
          fecha_expiracion: subs[0].fecha_expiracion
        });
      } else {
        console.log('❌ No se encontró suscripción');
      }
      
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

  // ✅ NUEVA: Función para diagnosticar y corregir suscripción
  const handleFixSubscription = async () => {
    setIsFixing(true);
    try {
      console.log('🔧 Diagnosticando suscripción...');
      
      // 1. Diagnosticar
      const debugResponse = await base44.functions.invoke('debugUserSubscription', {
        email: user.email
      });
      
      console.log('📋 Diagnóstico:', debugResponse.data);
      setDebugInfo(debugResponse.data);
      
      // 2. Si hay problemas, intentar corregir
      if (!debugResponse.data.ok || debugResponse.data.issues?.length > 0) {
        console.log('🔧 Intentando corregir...');
        
        const fixResponse = await base44.functions.invoke('fixUserSubscription', {
          email: user.email,
          forceActivate: true
        });
        
        console.log('✅ Resultado corrección:', fixResponse.data);
        
        if (fixResponse.data.ok) {
          toast.success('✅ Suscripción corregida correctamente');
          
          // Recargar todo
          await loadUser();
          queryClient.invalidateQueries({ queryKey: ['subscription'] });
        } else {
          toast.error('No se pudo corregir automáticamente. Contacta con soporte.');
        }
      } else {
        toast.info('Tu suscripción está correctamente configurada');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Error al verificar la suscripción');
    } finally {
      setIsFixing(false);
    }
  };

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('cancelSubscription', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success(data.message);
      setShowCancelDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Error al cancelar la suscripción');
    }
  });

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    await cancelSubscriptionMutation.mutateAsync();
    setIsCancelling(false);
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>;
      case "cancelado":
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      case "finalizada":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Finalizado</Badge>;
      case "en_prueba":
        return <Badge className="bg-blue-100 text-blue-800"><Info className="w-3 h-3 mr-1" />Prueba</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getDaysLeft = () => {
    if (!subscription) return 0;
    const today = new Date();
    const expiration = new Date(subscription.fecha_expiracion);
    const diffTime = expiration - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (!user || loadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  // ✅ MEJORADO: Pantalla sin suscripción con debug
  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("MyProfile"))}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al perfil
          </Button>

          <Card className="shadow-lg border-0 mb-6">
            <CardContent className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No se encontró registro de suscripción
              </h2>
              <p className="text-gray-600 mb-6">
                No se pudo encontrar tu suscripción en la base de datos
              </p>

              {/* ✅ Información de debug */}
              {user.subscription_status && (
                <Alert className="mb-6 bg-blue-50 border-blue-200 text-left">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <strong>Estado en tu cuenta:</strong><br/>
                    subscription_status: <code className="bg-blue-100 px-2 py-1 rounded">{user.subscription_status}</code><br/>
                    user_type: <code className="bg-blue-100 px-2 py-1 rounded">{user.user_type}</code>
                  </AlertDescription>
                </Alert>
              )}

              {debugInfo && (
                <Alert className="mb-6 bg-gray-50 border-gray-200 text-left max-h-96 overflow-auto">
                  <AlertDescription>
                    <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
                  </AlertDescription>
                </Alert>
              )}

              {/* ✅ Botones de acción */}
              <div className="flex flex-col gap-3 max-w-md mx-auto">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleFixSubscription}
                  disabled={isFixing}
                >
                  {isFixing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando y corrigiendo...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Verificar y corregir suscripción
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                >
                  Ver planes disponibles
                </Button>

                <p className="text-xs text-gray-500 mt-4">
                  Si el problema persiste después de verificar, contacta con soporte: admin@milautonomos.com
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft();
  const isActive = subscription.estado === "activo" || subscription.estado === "en_prueba";
  const isCancelled = subscription.estado === "cancelado";
  const isExpired = subscription.estado === "finalizada";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("MyProfile"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al perfil
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Suscripción</h1>
          <p className="text-gray-600">Administra tu plan y configuración de pagos</p>
        </div>

        {/* Status Alerts */}
        {isCancelled && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Suscripción cancelada.</strong> Tu perfil permanecerá activo hasta el{" "}
              <strong>{new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}</strong>
              {daysLeft > 0 && ` (${daysLeft} días restantes)`}.
              Después de esa fecha, tu perfil dejará de aparecer en las búsquedas.
            </AlertDescription>
          </Alert>
        )}

        {isExpired && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Tu suscripción ha finalizado.</strong> Tu perfil ya no es visible en las búsquedas.
              Reactiva tu plan para volver a recibir clientes.
            </AlertDescription>
          </Alert>
        )}

        {subscription?.estado === "en_prueba" && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>🎁 Prueba gratuita activa (7 días).</strong><br/>
              Tu periodo de prueba finaliza el <strong>{new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}</strong>.<br/>
              {daysLeft > 0 && `Quedan ${daysLeft} días de prueba gratuita.`}<br/>
              <strong>⚠️ Si no cancelas antes de esa fecha, se cobrará automáticamente 49€/mes y tu plan pasará a mensual.</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Plan Card */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-700" />
                Plan Actual
              </div>
              {getStatusBadge(subscription.estado)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Plan</p>
                <p className="text-xl font-bold text-gray-900">{plan?.nombre || subscription.plan_nombre}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Precio</p>
                <p className="text-xl font-bold text-gray-900">
                  {subscription.estado === "en_prueba" ? (
                    <>
                      <span className="text-green-600">GRATIS</span>
                      <span className="text-sm text-gray-600"> (luego {subscription.plan_precio}€/mes)</span>
                    </>
                  ) : (
                    `${subscription.plan_precio}€`
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Fecha de inicio</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="font-semibold text-gray-900">
                    {new Date(subscription.fecha_inicio).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">
                  {subscription.estado === "en_prueba" ? "Fin de prueba" : "Fecha de expiración"}
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="font-semibold text-gray-900">
                    {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              {daysLeft > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-2">
                    {subscription.estado === "en_prueba" ? "Tiempo de prueba restante" : "Tiempo restante"}
                  </p>
                  <div className={`rounded-lg p-4 ${subscription.estado === "en_prueba" ? "bg-blue-50" : "bg-blue-50"}`}>
                    <p className={`text-2xl font-bold ${subscription.estado === "en_prueba" ? "text-blue-900" : "text-blue-900"}`}>
                      {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                    </p>
                    <p className={`text-sm ${subscription.estado === "en_prueba" ? "text-blue-700" : "text-blue-700"}`}>
                      {subscription.estado === "en_prueba" 
                        ? "de prueba gratuita (luego 49€/mes si no cancelas)" 
                        : "hasta la próxima renovación"}
                    </p>
                  </div>
                </div>
              )}

              {subscription.renovacion_automatica && isActive && subscription.estado !== "en_prueba" && (
                <div className="md:col-span-2">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Renovación automática activada.</strong> Tu suscripción se renovará automáticamente el{" "}
                      {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ✅ NUEVO: Botón "Mejorar plan" */}
          {isActive && subscription.plan_id === "plan_monthly_trial" && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-purple-700 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Mejora tu plan
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ahorra hasta 138€/año cambiando a plan trimestral o anual
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

          {(isExpired || isCancelled) && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6 text-center">
                <RefreshCw className="w-12 h-12 text-blue-700 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Reactiva tu plan
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Vuelve a aparecer en las búsquedas y recibe nuevos clientes
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

          {isActive && (
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Cancelar suscripción
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {subscription.estado === "en_prueba" 
                    ? "Si cancelas durante la prueba, no se te cobrará nada. Tu perfil dejará de aparecer inmediatamente."
                    : "Tu perfil dejará de aparecer en las búsquedas inmediatamente, pero seguirás teniendo acceso hasta la fecha de expiración."}
                </p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar suscripción
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                Cambiar plan
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Explora otros planes que se adapten mejor a tus necesidades
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(createPageUrl("PricingPlans"))}
              >
                Ver todos los planes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ✅ NUEVO: Botón debug (solo visible si hay problemas) */}
        {(!isActive || subscriptionError) && (
          <Card className="mt-6 shadow-lg border-0 bg-gray-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ¿Problemas con tu suscripción?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Si completaste el pago pero tu suscripción no aparece correctamente, usa esta herramienta para sincronizarla.
              </p>
              <Button
                variant="outline"
                onClick={handleFixSubscription}
                disabled={isFixing}
                className="w-full"
              >
                {isFixing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar y sincronizar suscripción
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cancellation Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ¿Cancelar suscripción?
              </DialogTitle>
              <DialogDescription className="space-y-3 pt-4">
                <p>
                  Si cancelas tu suscripción:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  {subscription?.estado === "en_prueba" ? (
                    <>
                      <li><strong>NO se te cobrará nada</strong> (tu prueba gratuita se cancela)</li>
                      <li>Tu perfil <strong>dejará de aparecer inmediatamente</strong></li>
                      <li>Puedes reactivar en cualquier momento con otro plan</li>
                    </>
                  ) : (
                    <>
                      <li>Tu perfil <strong>dejará de aparecer en las búsquedas inmediatamente</strong></li>
                      <li>No recibirás nuevos contactos de clientes</li>
                      <li>Mantendrás acceso a tu cuenta hasta el <strong>{new Date(subscription?.fecha_expiracion).toLocaleDateString('es-ES')}</strong></li>
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
      </div>
    </div>
  );
}