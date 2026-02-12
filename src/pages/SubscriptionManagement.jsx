import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";
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
  Zap,
  AlertCircle,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../components/ui/LanguageSwitcher";
import SEOHead from "../components/seo/SEOHead";

export default function SubscriptionManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  // ✅ SINCRONIZAR CON STRIPE AL CARGAR - SIEMPRE
  const { data: syncResult, isLoading: syncing, refetch: refetchSync } = useQuery({
    queryKey: ['syncStripe', user?.id],
    queryFn: async () => {
      try {
        console.log('🔄 Iniciando sincronización con Stripe...');
        const response = await base44.functions.invoke('syncStripeSubscription', {});
        console.log('🔄 Sincronización Stripe:', response.data);
        
        // Si la sincronización encontró suscripción, invalidar cache
        if (response.data?.ok && response.data?.subscription) {
          sessionStorage.removeItem('current_user');
        }
        
        return response.data;
      } catch (error) {
        console.error('Error sincronizando con Stripe:', error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const { data: subscription, isLoading: loadingSubscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['subscription', user?.id, syncResult?.subscription?.id],
    queryFn: async () => {
      // Si syncResult tiene suscripción activa, usar esos datos
      if (syncResult?.subscription?.active) {
        const subs = await base44.entities.Subscription.filter({
          user_id: user.id
        });
        return subs[0];
      }
      
      const subs = await base44.entities.Subscription.filter({
        user_id: user.id
      });
      
      return subs[0];
    },
    enabled: !!user && !syncing,
    retry: 2,
    staleTime: 0,
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

  const handleFixSubscription = async () => {
    setIsFixing(true);
    try {
      const debugResponse = await base44.functions.invoke('debugUserSubscription', {
        email: user.email
      });
      
      if (!debugResponse.data.ok || debugResponse.data.issues?.length > 0) {
        const fixResponse = await base44.functions.invoke('fixUserSubscription', {
          email: user.email,
          forceActivate: true
        });
        
        if (fixResponse.data.ok) {
          toast.success("Suscripción corregida, recargando...");
          
          await loadUser();
          await queryClient.invalidateQueries({ queryKey: ['subscription'] });
        } else {
          toast.error("No se pudo corregir automáticamente");
        }
      } else {
        toast.info("La suscripción está correctamente configurada");
      }
    } catch (error) {
      toast.error("Error al verificar la suscripción");
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
      toast.error(error.message || "Error al cancelar la suscripción");
    }
  });

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await base44.functions.invoke('cancelSubscription', {});
      
      if (response.data?.success) {
        // 🔥 ACTUALIZACIÓN INMEDIATA
        await queryClient.invalidateQueries({ queryKey: ['subscription'] });
        await refetchSubscription();
        
        toast.success('Suscripción cancelada correctamente', {
          description: 'Tu perfil ya no es visible en búsquedas'
        });
        
        setShowCancelDialog(false);
        
        // 🔥 LIMPIAR CACHE
        sessionStorage.removeItem('current_user');
      } else {
        toast.error(response.data?.error || 'Error al cancelar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cancelar la suscripción');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsReactivating(true);
    try {
      const response = await base44.functions.invoke('reactivateSubscription', {});
      if (response.data.ok) {
        toast.success(response.data.message);
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        await loadUser();
      } else {
        toast.error(response.data.error || "Error al reactivar");
      }
    } catch (error) {
      toast.error(error.message || "Error al reactivar la suscripción");
    } finally {
      setIsReactivating(false);
    }
  };

  const handleUpgradePlan = async (newPlanId) => {
    setIsUpgrading(true);
    try {
      const response = await base44.functions.invoke('upgradeSubscription', {
        newPlanId
      });

      if (response.data?.ok) {
        toast.success(response.data.message);
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        await refetchSubscription();
      } else {
        toast.error(response.data?.error || 'Error al mejorar el plan');
      }
    } catch (error) {
      toast.error('Error al mejorar el plan');
    } finally {
      setIsUpgrading(false);
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{t('active')}</Badge>;
      case "cancelado":
        return <Badge className="bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3 mr-1" />{t('canceled')}</Badge>;
      case "finalizada":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />{t('finished')}</Badge>;
      case "en_prueba":
        return <Badge className="bg-blue-100 text-blue-800"><Info className="w-3 h-3 mr-1" />{t('trial')}</Badge>;
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

  if (!user || loadingSubscription || syncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        {syncing && (
          <p className="text-sm text-gray-600">Sincronizando con Stripe...</p>
        )}
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={`${t('mySubscription')} - MisAutónomos`}
        description={t('manageProfessionalPlan')}
        noindex={true}
      />
      
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("MyProfile"))}
            className="mb-6 hover:bg-gray-100"
            aria-label={t('backToProfile')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          {!subscription || subscription.estado === 'finalizada' ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-gray-400" />
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                {subscription?.estado === 'finalizada' ? 'Tu suscripción ha sido cancelada' : 'No tienes un plan activo'}
              </h2>
              
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {subscription?.estado === 'finalizada' 
                  ? 'Tu perfil ya no es visible en las búsquedas. Puedes volver a suscribirte cuando quieras.'
                  : 'Necesitas contratar un plan profesional para que tu perfil aparezca en las búsquedas'}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate(createPageUrl("PricingPlans"))}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  Ver planes disponibles
                </Button>
                
                <p className="text-sm text-gray-500">
                  ¿Necesitas ayuda? <a href="mailto:soporte@misautonomos.es" className="text-blue-600 hover:underline">soporte@misautonomos.es</a>
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ENCABEZADO DE ESTADO - Visual y Directo */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tu plan actual</p>
                    <h2 className="text-2xl font-semibold text-gray-900">{plan?.nombre || subscription.plan_nombre}</h2>
                  </div>
                  {subscription.estado === "activo" && (
                    <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activo
                    </Badge>
                  )}
                  {subscription.estado === "en_prueba" && (
                    <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1">
                      Periodo de prueba
                    </Badge>
                  )}
                  {subscription.estado === "cancelado" && (
                    <Badge className="bg-amber-100 text-amber-700 border-0 px-3 py-1">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Cancelado
                    </Badge>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Precio</span>
                    <span className="font-semibold text-gray-900">{plan?.precio || subscription.plan_precio}€/mes</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">
                      {subscription.estado === "en_prueba" ? "Fin de prueba" : "Próximo cobro"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                      {subscription.estado === "en_prueba" && getDaysLeft(subscription.fecha_expiracion) > 0 && (
                        <span className="text-blue-600 ml-2">
                          ({getDaysLeft(subscription.fecha_expiracion)} días)
                        </span>
                      )}
                    </span>
                  </div>

                  {subscription.estado === "en_prueba" && (
                    <div className="bg-blue-50 rounded-lg p-3 mt-3">
                      <p className="text-xs text-blue-900">
                        <strong>Periodo de prueba:</strong> Los primeros 7 días son gratis. 
                        Si no cancelas antes del {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}, 
                        se cobrará automáticamente {plan?.precio || subscription.plan_precio}€/mes.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ACCIONES PRINCIPALES */}
              <div className="space-y-4 mb-6">
                {/* UPGRADE si está en Plan Visibility */}
                {(subscription.estado === "activo" || subscription.estado === "en_prueba") && subscription.plan_id === 'plan_visibility' && (
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Mejorar a Plan Ads+</h3>
                        <p className="text-sm text-purple-100">
                          Acceso completo al Dashboard Pro + Campañas publicitarias gestionadas
                        </p>
                      </div>
                      <TrendingUp className="w-10 h-10 opacity-80" />
                    </div>
                    
                    <ul className="space-y-2 mb-4 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        CRM completo y gestión de clientes
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        Campañas en Instagram, Facebook y TikTok
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        Facturación y presupuestos automáticos
                      </li>
                    </ul>

                    <Button
                      className="w-full bg-white text-purple-700 hover:bg-purple-50 font-semibold"
                      onClick={() => handleUpgradePlan('plan_adsplus')}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Mejorar por 33€/mes
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-purple-100 mt-2 text-center">
                      Prorrateo automático. Solo pagas la diferencia del mes actual.
                    </p>
                  </div>
                )}

                {/* GESTIONAR PAGOS Y FACTURAS */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Gestionar método de pago</h3>
                      <p className="text-sm text-gray-600">
                        Actualiza tu tarjeta o consulta tus facturas
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={async () => {
                      try {
                        const response = await base44.functions.invoke('createStripePortalSession', {});
                        if (response.data?.url) {
                          window.location.href = response.data.url;
                        } else {
                          toast.error('Error al abrir el portal de pagos');
                        }
                      } catch (error) {
                        toast.error('Error al abrir el portal de pagos');
                      }
                    }}
                  >
                    Abrir portal de Stripe
                  </Button>
                </div>

                {/* REACTIVAR si está cancelado con días restantes */}
                {subscription.estado === "cancelado" && getDaysLeft(subscription.fecha_expiracion) > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">
                          Suscripción cancelada
                        </p>
                        <p className="text-sm text-gray-700">
                          Tu plan sigue activo hasta el {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}. 
                          Quedan {getDaysLeft(subscription.fecha_expiracion)} días.
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleReactivateSubscription}
                      disabled={isReactivating}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isReactivating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Reactivando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reactivar suscripción
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* REACTIVAR si está finalizado */}
                {(subscription.estado === "finalizada" || (subscription.estado === "cancelado" && getDaysLeft(subscription.fecha_expiracion) <= 0)) && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Tu plan ha expirado
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Tu perfil no es visible en las búsquedas
                    </p>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => navigate(createPageUrl("PricingPlans"))}
                    >
                      Ver planes disponibles
                    </Button>
                  </div>
                )}
              </div>

              {/* CANCELAR SUSCRIPCIÓN - Sutil pero visible */}
              {(subscription.estado === "activo" || subscription.estado === "en_prueba") && (
                <div className="border-t border-gray-200 pt-6">
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors mx-auto block"
                  >
                    Cancelar suscripción
                  </button>
                </div>
              )}
            </>
          )}

          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  ¿Cancelar tu suscripción?
                </DialogTitle>
                <DialogDescription className="space-y-4 pt-4 text-base">
                  {subscription?.estado === "en_prueba" ? (
                    <>
                      <p className="text-gray-700">
                        Si cancelas ahora, <strong>no se te cobrará nada</strong>. Tu prueba gratuita se detendrá inmediatamente.
                      </p>
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
                        <p className="text-sm text-amber-900">
                          Tu perfil dejará de aparecer en las búsquedas al instante y perderás tu plaza reservada (máximo 10 por ciudad).
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-700">
                        Tu suscripción seguirá activa hasta el <strong>{new Date(subscription?.fecha_expiracion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</strong>.
                      </p>
                      <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                        <p className="text-sm text-red-900">
                          Después de esa fecha, tu perfil pasará a ser gratuito y <strong>perderás tu plaza reservada</strong> (máximo 10 profesionales por ciudad).
                        </p>
                      </div>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(false)}
                  disabled={isCancelling}
                  className="w-full sm:w-auto"
                >
                  No, mantener activo
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="w-full sm:w-auto"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Sí, cancelar suscripción'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}