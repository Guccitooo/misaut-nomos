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
    await cancelSubscriptionMutation.mutateAsync();
    setIsCancelling(false);
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

  if (!user || loadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('mySubscription')}</h1>
              <p className="text-gray-600">{t('manageProfessionalPlan')}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("MyProfile"))}
              aria-label={t('backToProfile')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToProfile')}
            </Button>
          </div>

          {!subscription ? (
            <Card className="shadow-lg border-0">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t('noActiveSubscription')}
                </h2>
                
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {t('needPlanToAppear')}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate(createPageUrl("PricingPlans"))}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {t('viewAvailablePlans')}
                  </Button>
                  
                  {user?.role === 'admin' && (
                    <Button
                      onClick={handleFixSubscription}
                      disabled={isFixing}
                      variant="outline"
                      size="lg"
                    >
                      {isFixing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('verifying')}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {t('verifyPaymentAdmin')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6 shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-blue-700" />
                    {t('yourPlanInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{t('currentPlan')}</p>
                      <p className="text-xl font-bold text-gray-900">{plan?.nombre || subscription.plan_nombre}</p>
                    </div>
                    {getStatusBadge(subscription.estado)}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">{t('startDate')}</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(subscription.fecha_inicio).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('renewalExpiration')}</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}
                        {getDaysLeft(subscription.fecha_expiracion) > 0 && (
                          <span className="text-sm text-blue-600 ml-2">
                            ({getDaysLeft(subscription.fecha_expiracion)} {t('days')})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {subscription.estado === "activo" && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-green-900">
                        ✅ {t('profileVisibleOk')}
                      </p>
                    </div>
                  )}

                  {subscription.estado === "en_prueba" && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900">
                        🎁 {t('trialActive')}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {getDaysLeft(subscription.fecha_expiracion)} {t('daysRemainingTrial')}
                      </p>
                    </div>
                  )}

                  {subscription.estado === "cancelado" && getDaysLeft(subscription.fecha_expiracion) > 0 && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-900">
                            ⚠️ {t('subscriptionCanceledActive')} {new Date(subscription.fecha_expiracion).toLocaleDateString('es-ES')}.
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            {t('profileVisibleFor')} {getDaysLeft(subscription.fecha_expiracion)} {t('moreDays')}
                          </p>
                        </div>
                        <Button
                          onClick={handleReactivateSubscription}
                          disabled={isReactivating}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                        >
                          {isReactivating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Reactivando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Reactivar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {subscription.estado === "cancelado" && getDaysLeft(subscription.fecha_expiracion) <= 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-red-900">
                        ❌ {t('subscriptionFinishedHidden')}
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {t('considerReactivating')}
                      </p>
                    </div>
                  )}
                  
                  {subscription.estado === "finalizada" && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-red-900">
                        ❌ {t('subscriptionFinishedHidden')}
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {t('considerReactivating')}
                      </p>
                    </div>
                  )}

                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscription.estado === "en_prueba" && (
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="w-12 h-12 text-blue-700 mx-auto mb-3" />
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {t('upgradeYourPlan')}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {t('saveUpTo')}
                      </p>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate(createPageUrl("PricingPlans"))}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {t('viewSuperiorPlans')}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {(subscription.estado === "finalizada" || (subscription.estado === "cancelado" && getDaysLeft(subscription.fecha_expiracion) <= 0)) && (
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6 text-center">
                      <RefreshCw className="w-12 h-12 text-blue-700 mx-auto mb-3" />
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {t('reactivateYourPlan')}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {t('appearInSearches')}
                      </p>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate(createPageUrl("PricingPlans"))}
                      >
                        {t('viewAvailablePlans')}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {subscription.estado === "cancelado" && getDaysLeft(subscription.fecha_expiracion) > 0 && (
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6 text-center">
                      <RefreshCw className="w-12 h-12 text-green-700 mx-auto mb-3" />
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        Reactivar suscripción
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Tienes <strong>{getDaysLeft(subscription.fecha_expiracion)} días restantes</strong>
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Reactiva ahora sin coste adicional y aprovecha el tiempo restante
                      </p>
                      <Button
                        onClick={handleReactivateSubscription}
                        disabled={isReactivating}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isReactivating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Reactivando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Reactivar suscripción gratis
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {(subscription.estado === "activo" || subscription.estado === "en_prueba") && (
                  <Card className="shadow-lg border-0">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {t('cancelSubscription')}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {subscription.estado === "en_prueba" 
                          ? t('cancelTrialNoCharge')
                          : t('cancelHideProfile')}
                      </p>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {t('cancelSubscription')}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {t('changePlan')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('exploreOtherPlans')}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(createPageUrl("PricingPlans"))}
                    >
                      {t('viewAllPlans')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  {t('confirmCancelSubscription')}
                </DialogTitle>
                <DialogDescription className="space-y-3 pt-4">
                  <p>
                    {t('ifYouCancel')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    {subscription?.estado === "en_prueba" ? (
                      <>
                        <li><strong>{t('noChargeTrialCanceled')}</strong></li>
                        <li>{t('profileHidesImmediately')}</li>
                        <li>{t('canReactivateAnytime')}</li>
                      </>
                    ) : (
                      <>
                        <li>{t('profileHidesFromSearch')}</li>
                        <li>{t('noNewClientContacts')}</li>
                        <li>{t('accessUntil')} <strong>{new Date(subscription?.fecha_expiracion).toLocaleDateString('es-ES')}</strong></li>
                        <li>{t('canReactivateSubscription')}</li>
                      </>
                    )}
                  </ul>
                  <p className="text-gray-900 font-semibold pt-2">
                    {t('areYouSureContinue')}
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(false)}
                  disabled={isCancelling}
                >
                  {t('noKeepActive')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('canceling')}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('yesCancelSubscription')}
                    </>
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